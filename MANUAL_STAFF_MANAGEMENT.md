# Дополнение к плану развития: Ручное управление доступностью мастеров

## 🎯 Новая функциональность: Ручное управление мастерами на смены

### Описание задачи
Администраторы и менеджеры должны иметь возможность вручную:
- **Ставить мастера на смену** - даже если у него нет запланированного графика
- **Убирать мастера со смены** - временно отключать доступность при наличии графика
- **Отслеживать изменения** - кто, когда и почему менял доступность

---

## 🗄️ Обновленная модель данных

### Изменения в таблице `staff_shifts`
```sql
-- Добавлены новые поля для ручного управления:
is_manually_disabled boolean DEFAULT false, -- ручное отключение администратором
manual_disable_reason text, -- причина ручного отключения
created_by uuid, -- кто создал смену (staff_id или admin_id)
updated_by uuid, -- кто последний раз обновлял
```

### Новая таблица `staff_availability_logs`
```sql
CREATE TABLE staff_availability_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    shift_id uuid REFERENCES staff_shifts(id) ON DELETE CASCADE,
    action varchar(50) NOT NULL, -- 'enabled', 'disabled', 'shift_created', etc.
    previous_status boolean, -- предыдущий статус доступности
    new_status boolean, -- новый статус доступности
    reason text, -- причина изменения
    changed_by uuid NOT NULL, -- ID пользователя, который внёс изменения
    changed_at timestamp NOT NULL DEFAULT now(),
    metadata jsonb -- дополнительная информация
);
```

---

## 📡 Новые API Endpoints

### 1. Ручное управление доступностью

**PUT /api/v1/businesses/{businessID}/staffs/{staffID}/shifts/{shiftID}/availability**
- Включение/отключение доступности существующей смены
- Body: `UpdateShiftAvailabilityRequest`

```go
type UpdateShiftAvailabilityRequest struct {
    IsAvailable bool   `json:"is_available" validate:"required"`
    Reason      string `json:"reason,omitempty" validate:"max=500"`
    ActionBy    string `json:"action_by" validate:"required,uuid4"` // ID администратора
}
```

**POST /api/v1/businesses/{businessID}/staffs/{staffID}/shifts/manual**
- Создание внеплановой смены вручную (например, срочный вызов мастера)
- Body: `CreateManualShiftRequest`

```go
type CreateManualShiftRequest struct {
    ShiftDate      string `json:"shift_date" validate:"required"`
    StartTime      string `json:"start_time" validate:"required"`
    EndTime        string `json:"end_time" validate:"required"`
    BreakStartTime string `json:"break_start_time,omitempty"`
    BreakEndTime   string `json:"break_end_time,omitempty"`
    ShiftType      string `json:"shift_type" validate:"oneof=regular overtime holiday emergency"`
    Reason         string `json:"reason" validate:"required,max=500"`
    CreatedBy      string `json:"created_by" validate:"required,uuid4"`
    Notes          string `json:"notes,omitempty"`
}
```

### 2. Быстрые действия для администраторов

**POST /api/v1/businesses/{businessID}/staffs/{staffID}/quick-actions/enable**
- Быстро включить мастера на сегодня/завтра
- Body: `QuickEnableStaffRequest`

**POST /api/v1/businesses/{businessID}/staffs/{staffID}/quick-actions/disable**
- Быстро отключить мастера на период
- Body: `QuickDisableStaffRequest`

```go
type QuickEnableStaffRequest struct {
    Date       string `json:"date" validate:"required"`         // "2025-08-25"
    StartTime  string `json:"start_time" validate:"required"`   // "10:00"
    EndTime    string `json:"end_time" validate:"required"`     // "18:00"
    Reason     string `json:"reason" validate:"required,max=500"`
    ActionBy   string `json:"action_by" validate:"required,uuid4"`
}

type QuickDisableStaffRequest struct {
    FromDate string `json:"from_date" validate:"required"`
    ToDate   string `json:"to_date,omitempty"` // если не указано, то только на один день
    Reason   string `json:"reason" validate:"required,max=500"`
    ActionBy string `json:"action_by" validate:"required,uuid4"`
}
```

### 3. Отслеживание изменений

**GET /api/v1/businesses/{businessID}/staffs/{staffID}/availability-logs**
- История изменений доступности мастера
- Query params: `from`, `to`, `limit`, `offset`

**GET /api/v1/businesses/{businessID}/availability-logs**
- История изменений по всем мастерам бизнеса
- Query params: `from`, `to`, `staff_id`, `action`, `limit`, `offset`

---

## 🔧 Логика работы системы

### Алгоритм определения доступности мастера

```go
func (s *StaffShiftService) IsStaffAvailable(staffID string, datetime time.Time) (bool, string) {
    // 1. Найти смену на указанное время
    shift := s.GetShiftByStaffAndTime(staffID, datetime)
    
    if shift == nil {
        return false, "Нет запланированной смены"
    }
    
    // 2. Проверить общую доступность смены
    if !shift.IsAvailable {
        return false, "Смена отключена"
    }
    
    // 3. Проверить ручное отключение администратором
    if shift.IsManuallyDisabled {
        return false, shift.ManualDisableReason
    }
    
    // 4. Проверить время обеденного перерыва
    if shift.IsBreakTime(datetime) {
        return false, "Обеденный перерыв"
    }
    
    // 5. Проверить существующие бронирования
    if s.HasBookingAtTime(staffID, datetime) {
        return false, "Уже забронировано"
    }
    
    return true, ""
}
```

### Приоритеты статусов доступности

1. **Ручное отключение администратором** (`is_manually_disabled = true`) - высший приоритет
2. **Общая доступность смены** (`is_available = false`) - отключение всей смены
3. **Обеденный перерыв** - временная недоступность
4. **Существующие бронирования** - занятое время
5. **Доступен** - мастер свободен для бронирования

---

## 📱 UI/UX Сценарии использования

### Сценарий 1: Экстренный вызов мастера
```
Ситуация: Мастер заболел, нужно срочно поставить другого
Действие администратора:
1. Найти свободного мастера
2. POST /api/v1/.../shifts/manual с типом "emergency"
3. Указать причину "Замена заболевшего коллеги"
4. Мастер сразу появляется в расписании
```

### Сценарий 2: Временное отключение мастера
```
Ситуация: Мастер опаздывает на 2 часа
Действие администратора:
1. Найти текущую смену мастера
2. PUT /api/v1/.../shifts/{id}/availability
3. is_available: false, reason: "Опоздание на 2 часа"
4. Клиенты не видят слоты этого мастера до включения
```

### Сценарий 3: Продление рабочего дня
```
Ситуация: Много клиентов, нужно продлить смену
Действие администратора:
1. Найти текущую смену
2. PUT /api/v1/.../shifts/{id} - обновить end_time
3. Автоматически появляются новые слоты для бронирования
```

---

## 🎨 Расширенные DTO

### Response модели
```go
type ShiftWithAvailabilityResponse struct {
    ID                  string    `json:"id"`
    StaffID             string    `json:"staff_id"`
    StaffName           string    `json:"staff_name"`
    ShiftDate           string    `json:"shift_date"`
    StartTime           string    `json:"start_time"`
    EndTime             string    `json:"end_time"`
    BreakStartTime      string    `json:"break_start_time,omitempty"`
    BreakEndTime        string    `json:"break_end_time,omitempty"`
    IsAvailable         bool      `json:"is_available"`
    IsManuallyDisabled  bool      `json:"is_manually_disabled"`
    ManualDisableReason string    `json:"manual_disable_reason,omitempty"`
    ShiftType           string    `json:"shift_type"`
    Notes               string    `json:"notes,omitempty"`
    BookingsCount       int       `json:"bookings_count"`
    TotalBookingTime    int       `json:"total_booking_time_minutes"`
    AvailableSlots      []string  `json:"available_slots"` // список свободных временных слотов
    CreatedBy           string    `json:"created_by,omitempty"`
    UpdatedBy           string    `json:"updated_by,omitempty"`
    CreatedAt           time.Time `json:"created_at"`
    UpdatedAt           time.Time `json:"updated_at"`
}

type AvailabilityLogResponse struct {
    ID              string                 `json:"id"`
    StaffID         string                 `json:"staff_id"`
    StaffName       string                 `json:"staff_name"`
    ShiftID         string                 `json:"shift_id,omitempty"`
    Action          string                 `json:"action"`
    PreviousStatus  *bool                  `json:"previous_status"`
    NewStatus       *bool                  `json:"new_status"`
    Reason          string                 `json:"reason,omitempty"`
    ChangedBy       string                 `json:"changed_by"`
    ChangedByName   string                 `json:"changed_by_name"`
    ChangedAt       time.Time              `json:"changed_at"`
    Metadata        map[string]interface{} `json:"metadata,omitempty"`
}
```

---

## 🔐 Права доступа и безопасность

### Уровни доступа
1. **Владелец бизнеса** - полный доступ ко всем функциям
2. **Администратор** - может управлять всеми мастерами
3. **Менеджер смены** - может управлять только в свою смену
4. **Мастер** - может управлять только своим расписанием (ограниченно)

### Аудит действий
- Все изменения доступности логируются в `staff_availability_logs`
- IP адрес и User Agent сохраняются в metadata
- Невозможно удалить логи (только архивирование)

---

## 🚀 Преимущества новой системы

✅ **Максимальная гибкость**
- Можно поставить любого мастера на любое время
- Можно временно отключить мастера без удаления смены
- Разные типы смен (обычные, экстренные, праздничные)

✅ **Полная отслеживаемость**
- Кто, когда и почему менял доступность
- История всех изменений
- Возможность анализа эффективности

✅ **Удобство для администраторов**
- Быстрые действия для частых сценариев
- Массовые операции
- Интуитивно понятный API

✅ **Надежность**
- Невозможно создать конфликтующие смены
- Автоматическая проверка пересечений
- Откат изменений при необходимости

Эта система обеспечивает полный контроль над расписанием мастеров и позволяет оперативно реагировать на любые изменения в работе салона!