# Спецификация проекта my-place

## 📋 Обзор проекта

**my-place** — это Go-backend сервис для управления бизнес-операциями салонов красоты, барбершопов и других сервисных предприятий. Система предоставляет цифровую платформу для планирования и управления ресурсами.

### Целевые пользователи
- Владельцы бизнеса (салоны красоты, барбершопы, клиники)
- Администраторы
- Разработчики, интегрирующие систему

### Основные проблемы, которые решает система
- Управление бизнес-сущностями, персоналом и доступными услугами
- Обработка клиентских бронирований с временными слотами
- Предоставление структурированного REST API с OpenAPI документацией
- Обеспечение постоянного хранения данных с PostgreSQL и миграциями схемы

## 🏗️ Архитектура системы

### Архитектурный паттерн
Проект следует принципам **Clean Architecture** с четким разделением на слои:

```
cmd/                    # Точки входа приложения
├── api/               # HTTP сервер
└── swag/              # Обработка Swagger документации

internal/
├── domain/            # Бизнес-модели и интерфейсы
├── dto/               # Объекты передачи данных
├── repository/        # Слой доступа к данным
├── usecase/           # Слой бизнес-логики
└── server/
    ├── handlers/      # HTTP обработчики
    └── middleware/    # HTTP middleware

migrations/            # Миграции базы данных
pkg/                   # Общие утилиты
```

### Используемые паттерны проектирования
- **Dependency Injection**: Обработчики зависят от use cases, которые зависят от репозиториев
- **Repository Pattern**: Абстракция операций с базой данных
- **DTO Pattern**: Разделение внутренних моделей и API payload
- **Middleware Pattern**: Для логирования и обработки JSON ответов

### Взаимодействие компонентов
1. HTTP запрос → Chi router → Handler (`server/handlers`)
2. Handler вызывает Use Case (`usecase`)
3. Use Case использует Repository для взаимодействия с БД
4. Ответ возвращается через DTO со структурированным JSON

## 🛠️ Технологический стек

### Основные технологии
- **Язык**: Go 1.24.6
- **Web фреймворк**: github.com/go-chi/chi/v5 (роутер)
- **База данных**: PostgreSQL с драйвером github.com/jackc/pgx/v5
- **Валидация**: github.com/go-playground/validator/v10
- **Логирование**: go.uber.org/zap
- **Переменные окружения**: github.com/joho/godotenv
- **OpenAPI документация**: swaggo/swag + api-spec-converter

### Управление зависимостями
Управляется через `go.mod`, ключевые версии:
- chi/v5: v5.2.2
- pgx/v5: v5.7.5
- zap: v1.27.0
- validator/v10: v10.27.0

## 📊 Модель данных

### Основные сущности

```mermaid
erDiagram
    BUSINESS {
        uuid id PK
        text name
        text timezone
        timestamp created_at
        timestamp updated_at
    }
    
    SERVICE {
        uuid id PK
        uuid business_id FK
        text name
        int duration_min
        int price_cents
        timestamp created_at
        timestamp updated_at
    }
    
    STAFF {
        uuid id PK
        uuid business_id FK
        text full_name
        timestamp created_at
        timestamp updated_at
    }
    
    BOOKING {
        uuid id PK
        uuid service_id FK
        uuid staff_id FK
        text customer_name
        text customer_email
        timestamp start_at
        timestamp end_at
        timestamp created_at
        timestamp updated_at
    }
    
    BUSINESS ||--o{ SERVICE : "имеет"
    BUSINESS ||--o{ STAFF : "имеет"
    SERVICE ||--o{ BOOKING : "используется в"
    STAFF ||--o{ BOOKING : "проводит"
```

### Описание сущностей

**Business (Бизнес)**
- `id`: Уникальный идентификатор
- `name`: Название компании
- `timezone`: Часовой пояс (по умолчанию UTC)

**Service (Услуга)**
- `id`: Уникальный идентификатор
- `business_id`: Ссылка на бизнес
- `name`: Название услуги
- `duration_min`: Продолжительность в минутах
- `price_cents`: Цена в копейках

**Staff (Персонал)**
- `id`: Уникальный идентификатор
- `business_id`: Ссылка на бизнес
- `full_name`: Полное имя сотрудника

**Booking (Бронирование)**
- `id`: Уникальный идентификатор
- `service_id`: Ссылка на услугу
- `staff_id`: Ссылка на сотрудника
- `customer_name`: Имя клиента
- `customer_email`: Email клиента
- `start_at`: Время начала
- `end_at`: Время окончания (рассчитывается автоматически)

## 🔌 API Спецификация

### Базовый URL
```
http://localhost:81/api/v1
```

### Аутентификация
Все endpoints требуют Bearer токен в заголовке:
```
Authorization: Bearer <token>
```

### Endpoints

#### Business Management

**POST /businesses**
- Создание нового бизнеса
- Body: `CreateBusinessRequest`
- Response: `201 Created`

**GET /businesses/{businessID}**
- Получение бизнеса по ID
- Response: `Business` object

#### Service Management

**POST /businesses/{businessID}/services**
- Создание новой услуги
- Body: `CreateServiceRequest`
- Response: `201 Created`

**GET /businesses/{businessID}/services**
- Получение всех услуг бизнеса
- Response: `Service[]`

#### Staff Management

**POST /businesses/{businessID}/staffs**
- Создание нового сотрудника
- Body: `CreateStaffRequest`
- Response: `201 Created`

**GET /businesses/{businessID}/staffs**
- Получение всех сотрудников бизнеса
- Response: `Staff[]`

#### Booking Management

**POST /businesses/{businessID}/bookings**
- Создание нового бронирования
- Body: `CreateBookingRequest`
- Response: `201 Created`

**GET /businesses/{businessID}/bookings/availability**
- Получение доступных временных слотов
- Query params: `day` (YYYY-MM-DD), `staff_id` (optional)
- Response: `SlotResponse[]`

### DTO Структуры

```go
// Запрос на создание бронирования
type CreateBookingRequest struct {
    ServiceID     string    `json:"service_id" validate:"required,uuid4"`
    StaffID       string    `json:"staff_id" validate:"required,uuid4"`
    StartAt       time.Time `json:"start_at" validate:"required"`
    CustomerName  string    `json:"customer_name" validate:"required,min=2,max=100"`
    CustomerEmail string    `json:"customer_email" validate:"required,email"`
}

// Ответ с временным слотом
type SlotResponse struct {
    StaffID string    `json:"staff_id"`
    Start   time.Time `json:"start"`
    End     time.Time `json:"end"`
}
```

## 🚀 Среда разработки и развертывание

### Необходимые инструменты
- Go 1.24.6
- PostgreSQL
- Docker & Docker Compose
- swag (генератор Swagger)
- api-spec-converter (Node.js инструмент)
- npm

### Настройка среды разработки

1. **Установка зависимостей**:
   ```bash
   make swagger-init
   ```

2. **Настройка переменных окружения** в `.env`:
   ```env
   APP_ENV=local
   APP_HTTP_PORT=81
   POSTGRES_DSN=postgres://postgres:postgres@localhost:5432/myplace?sslmode=disable
   JWT_SECRET=change-me
   ```

3. **Запуск базы данных и сервиса**:
   ```bash
   make up          # Запуск PostgreSQL через Docker
   make migrate-up  # Применение миграций БД
   make dev         # Запуск API сервера
   ```

### Команды для сборки и развертывания

**Локальная разработка**:
```bash
make dev
```

**Docker инфраструктура**:
```bash
make up            # Запуск контейнеров
make down          # Остановка контейнеров
```

**Миграции**:
```bash
make migrate-up    # Применить миграции
make migrate-down  # Откатить миграции
make migrate-status # Статус миграций
```

**Тестирование и качество кода**:
```bash
make test          # Запуск тестов
make lint          # Линтер
```

**Генерация документации**:
```bash
make swagger       # Генерация OpenAPI документации
```

## 🔒 Безопасность и валидация

### Валидация входных данных
- UUID валидация для service_id и staff_id
- Email валидация для customer_email
- Валидация обязательных полей через struct tags
- Валидация формата даты (YYYY-MM-DD) для запросов доступности

### Обработка ошибок
- Правильные HTTP статус коды (400, 401, 403, 404, 409, 422, 500)
- Детальные сообщения об ошибках для различных сценариев
- JSON ответы об ошибках, следующие паттернам проекта

### Структура ответа об ошибке
```json
{
  "error": "описание ошибки"
}
```

## 🧪 Бизнес-логика

### Создание бронирования
1. **Валидация**: Проверка что услуга и сотрудник принадлежат бизнесу
2. **Расчет времени**: Автоматический расчет времени окончания на основе продолжительности услуги
3. **Проверка конфликтов**: Предотвращение пересекающихся бронирований
4. **Создание записи**: Сохранение в базе данных

### Проверка доступности
1. **Генерация слотов**: 30-минутные интервалы с 9:00 до 18:00
2. **Фильтрация**: Исключение забронированного времени
3. **Группировка по сотрудникам**: Отдельные слоты для каждого сотрудника

## 📈 Производительность

- Использует `pgx/v5` для эффективного взаимодействия с PostgreSQL
- Структурированное логирование с `zap`
- Пулинг соединений к базе данных
- Оптимизированные SQL запросы

## 🔧 Конфигурация роутера Chi

### Важные правила
1. Использовать Chi router v5 последовательно во всех файлах с путем импорта `"github.com/go-chi/chi/v5"`
2. При определении вложенных маршрутов, убедиться что специфичные бизнес-маршруты определены перед вложенными ресурсными маршрутами
3. Поддерживать консистентное именование параметров маршрута (например, `{businessID}`)
4. Для 404 ошибок: сначала проверить несоответствия версий, затем проверить порядок маршрутов и консистентность параметров

## 🐛 Известные проблемы и риски

- **Сложность инструментов документации**: Требует как Go, так и Node.js инструменты
- **Конфигурация PATH**: Ручная настройка `GOPATH/bin` и npm глобальных бинарников может вызвать проблемы
- **Инструмент миграций**: Зависит от `goose`, требует корректный `POSTGRES_DSN` в окружении

## 📝 Дополнительные заметки

- Проект использует современную версию Go (1.24.6)
- OpenAPI документация пост-обрабатывается через `cmd/swag/postprocess.go`
- Файл миграции `20250821131725_init_schema.sql` содержит полную схему базы данных

---

*Дата создания спецификации: 25 августа 2025*
*Версия API: 1.0*