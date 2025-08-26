package domain

import "time"

// =======================
// Schedule Template Models
// =======================

// ScheduleTemplate представляет шаблон расписания для сотрудника
type ScheduleTemplate struct {
	ID          string                 `json:"id"`
	StaffID     string                 `json:"staff_id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	IsDefault   bool                   `json:"is_default"`
	Schedule    WeeklyScheduleTemplate `json:"schedule"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

// WeeklyScheduleTemplate представляет недельный шаблон расписания
type WeeklyScheduleTemplate struct {
	Monday    DayScheduleTemplate `json:"monday"`
	Tuesday   DayScheduleTemplate `json:"tuesday"`
	Wednesday DayScheduleTemplate `json:"wednesday"`
	Thursday  DayScheduleTemplate `json:"thursday"`
	Friday    DayScheduleTemplate `json:"friday"`
	Saturday  DayScheduleTemplate `json:"saturday"`
	Sunday    DayScheduleTemplate `json:"sunday"`
}

// DayScheduleTemplate представляет шаблон рабочего дня
type DayScheduleTemplate struct {
	IsWorkingDay   bool            `json:"is_working_day"`
	StartTime      string          `json:"start_time"`       // "09:00"
	EndTime        string          `json:"end_time"`         // "18:00"
	BreakStartTime string          `json:"break_start_time"` // "12:00"
	BreakEndTime   string          `json:"break_end_time"`   // "13:00"
	Shifts         []ShiftTemplate `json:"shifts"`
}

// ShiftTemplate представляет шаблон смены в рамках дня
type ShiftTemplate struct {
	StartTime      string `json:"start_time"`
	EndTime        string `json:"end_time"`
	BreakStartTime string `json:"break_start_time"`
	BreakEndTime   string `json:"break_end_time"`
	ShiftType      string `json:"shift_type"` // regular, overtime
}

// =======================
// Enhanced Shift Models
// =======================

// StaffShift представляет конкретную рабочую смену сотрудника
type StaffShift struct {
	ID                  string    `json:"id"`
	StaffID             string    `json:"staff_id"`
	ShiftDate           time.Time `json:"shift_date"`
	StartTime           string    `json:"start_time"`       // "09:00"
	EndTime             string    `json:"end_time"`         // "18:00"
	BreakStartTime      string    `json:"break_start_time"` // "12:00"
	BreakEndTime        string    `json:"break_end_time"`   // "13:00"
	IsAvailable         bool      `json:"is_available"`
	IsManuallyDisabled  bool      `json:"is_manually_disabled"`
	ManualDisableReason string    `json:"manual_disable_reason"`
	ShiftType           string    `json:"shift_type"` // regular, overtime, holiday, emergency
	Notes               string    `json:"notes"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
	CreatedBy           string    `json:"created_by"`
	UpdatedBy           string    `json:"updated_by"`
}

// CalculateWorkingHours вычисляет количество рабочих часов в смене
func (s *StaffShift) CalculateWorkingHours() float64 {
	start, err := time.Parse("15:04", s.StartTime)
	if err != nil {
		return 0
	}

	end, err := time.Parse("15:04", s.EndTime)
	if err != nil {
		return 0
	}

	totalMinutes := end.Sub(start).Minutes()

	// Вычитаем время перерыва, если оно задано
	if s.BreakStartTime != "" && s.BreakEndTime != "" {
		breakStart, err1 := time.Parse("15:04", s.BreakStartTime)
		breakEnd, err2 := time.Parse("15:04", s.BreakEndTime)

		if err1 == nil && err2 == nil {
			breakMinutes := breakEnd.Sub(breakStart).Minutes()
			totalMinutes -= breakMinutes
		}
	}

	return totalMinutes / 60 // возвращаем часы
}

// IsTimeInBreak проверяет, попадает ли время в перерыв
func (s *StaffShift) IsTimeInBreak(checkTime time.Time) bool {
	if s.BreakStartTime == "" || s.BreakEndTime == "" {
		return false
	}

	breakStart, err1 := time.Parse("15:04", s.BreakStartTime)
	breakEnd, err2 := time.Parse("15:04", s.BreakEndTime)

	if err1 != nil || err2 != nil {
		return false
	}

	// Создаем время на ту же дату, что и проверяемое время
	shiftDate := s.ShiftDate
	breakStartTime := time.Date(shiftDate.Year(), shiftDate.Month(), shiftDate.Day(),
		breakStart.Hour(), breakStart.Minute(), 0, 0, checkTime.Location())
	breakEndTime := time.Date(shiftDate.Year(), shiftDate.Month(), shiftDate.Day(),
		breakEnd.Hour(), breakEnd.Minute(), 0, 0, checkTime.Location())

	return checkTime.After(breakStartTime) && checkTime.Before(breakEndTime)
}

// =======================
// Time Off Models
// =======================

// TimeOffRequest представляет заявку на отпуск/отгул
type TimeOffRequest struct {
	ID          string     `json:"id"`
	StaffID     string     `json:"staff_id"`
	StartDate   time.Time  `json:"start_date"`
	EndDate     time.Time  `json:"end_date"`
	Type        string     `json:"type"` // vacation, sick_leave, personal_day, emergency
	Reason      string     `json:"reason"`
	Status      string     `json:"status"` // pending, approved, rejected, cancelled
	IsHalfDay   bool       `json:"is_half_day"`
	HalfDayType string     `json:"half_day_type"` // morning, afternoon
	RequestedBy string     `json:"requested_by"`
	ApprovedBy  string     `json:"approved_by"`
	Comments    string     `json:"comments"`
	RequestedAt time.Time  `json:"requested_at"`
	ProcessedAt *time.Time `json:"processed_at"`
}

// IsApproved проверяет, одобрена ли заявка
func (t *TimeOffRequest) IsApproved() bool {
	return t.Status == "approved"
}

// IsActive проверяет, активна ли заявка на указанную дату
func (t *TimeOffRequest) IsActive(date time.Time) bool {
	if !t.IsApproved() {
		return false
	}

	return (date.Equal(t.StartDate) || date.After(t.StartDate)) &&
		(date.Equal(t.EndDate) || date.Before(t.EndDate))
}

// GetDaysCount возвращает количество дней отпуска
func (t *TimeOffRequest) GetDaysCount() int {
	if t.IsHalfDay {
		return 1 // половина дня считается как 1 день
	}

	days := int(t.EndDate.Sub(t.StartDate).Hours()/24) + 1
	return days
}

// =======================
// Schedule Views and Aggregates
// =======================

// WeeklyScheduleView представляет расписание на неделю
type WeeklyScheduleView struct {
	WeekStartDate  time.Time             `json:"week_start_date"`
	WeekEndDate    time.Time             `json:"week_end_date"`
	StaffSchedules []StaffWeeklySchedule `json:"staff_schedules"`
}

// StaffWeeklySchedule расписание одного сотрудника на неделю
type StaffWeeklySchedule struct {
	StaffID    string                     `json:"staff_id"`
	StaffName  string                     `json:"staff_name"`
	Position   string                     `json:"position"`
	Days       map[string]DayScheduleView `json:"days"` // "2025-01-13" -> DayScheduleView
	TotalHours float64                    `json:"total_hours"`
	TimeOff    []TimeOffRequest           `json:"time_off"`
}

// DayScheduleView расписание на один день
type DayScheduleView struct {
	Date          time.Time    `json:"date"`
	DayOfWeek     string       `json:"day_of_week"`
	IsWorkingDay  bool         `json:"is_working_day"`
	Shifts        []StaffShift `json:"shifts"`
	TotalHours    float64      `json:"total_hours"`
	HasTimeOff    bool         `json:"has_time_off"`
	TimeOffReason string       `json:"time_off_reason"`
}

// =======================
// Statistics Models
// =======================

// ScheduleStats статистика по расписанию сотрудника
type ScheduleStats struct {
	StaffID            string    `json:"staff_id"`
	StaffName          string    `json:"staff_name"`
	Period             string    `json:"period"`
	StartDate          time.Time `json:"start_date"`
	EndDate            time.Time `json:"end_date"`
	TotalWorkingDays   int       `json:"total_working_days"`
	TotalWorkingHours  float64   `json:"total_working_hours"`
	TotalOvertimeHours float64   `json:"total_overtime_hours"`
	VacationDays       int       `json:"vacation_days"`
	SickLeaveDays      int       `json:"sick_leave_days"`
	AverageHoursPerDay float64   `json:"average_hours_per_day"`
	UtilizationRate    float64   `json:"utilization_rate"`
}

// CalculateUtilizationRate вычисляет коэффициент использования времени
func (s *ScheduleStats) CalculateUtilizationRate() {
	if s.TotalWorkingDays == 0 {
		s.UtilizationRate = 0
		return
	}

	// Предполагаем 8-часовой рабочий день как норму
	expectedHours := float64(s.TotalWorkingDays) * 8.0
	if expectedHours > 0 {
		s.UtilizationRate = (s.TotalWorkingHours / expectedHours) * 100
	}
}

// CalculateAverageHours вычисляет среднее количество часов в день
func (s *ScheduleStats) CalculateAverageHours() {
	if s.TotalWorkingDays == 0 {
		s.AverageHoursPerDay = 0
		return
	}

	s.AverageHoursPerDay = s.TotalWorkingHours / float64(s.TotalWorkingDays)
}

// =======================
// Availability and Logging Models
// =======================

// StaffAvailabilityLog лог изменений доступности сотрудника
type StaffAvailabilityLog struct {
	ID             string                 `json:"id"`
	StaffID        string                 `json:"staff_id"`
	ShiftID        string                 `json:"shift_id"`
	Action         string                 `json:"action"` // enabled, disabled, shift_created, shift_deleted, shift_modified
	PreviousStatus bool                   `json:"previous_status"`
	NewStatus      bool                   `json:"new_status"`
	Reason         string                 `json:"reason"`
	ChangedBy      string                 `json:"changed_by"`
	ChangedAt      time.Time              `json:"changed_at"`
	Metadata       map[string]interface{} `json:"metadata"`
}

// =======================
// Schedule Generation Models
// =======================

// ScheduleGenerationRule правило генерации расписания
type ScheduleGenerationRule struct {
	ID          string                 `json:"id"`
	BusinessID  string                 `json:"business_id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	IsActive    bool                   `json:"is_active"`
	Priority    int                    `json:"priority"`
	Conditions  map[string]interface{} `json:"conditions"` // JSON с условиями
	Actions     map[string]interface{} `json:"actions"`    // JSON с действиями
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

// RecurringSchedulePattern паттерн повторяющегося расписания
type RecurringSchedulePattern struct {
	ID             string                 `json:"id"`
	StaffID        string                 `json:"staff_id"`
	Name           string                 `json:"name"`
	PatternType    string                 `json:"pattern_type"`    // daily, weekly, monthly
	RecurrenceRule string                 `json:"recurrence_rule"` // правило повторения в формате RRULE
	StartDate      time.Time              `json:"start_date"`
	EndDate        *time.Time             `json:"end_date"`
	IsActive       bool                   `json:"is_active"`
	Schedule       WeeklyScheduleTemplate `json:"schedule"`
	CreatedAt      time.Time              `json:"created_at"`
	UpdatedAt      time.Time              `json:"updated_at"`
}

// =======================
// Conflict Resolution Models
// =======================

// ScheduleConflict представляет конфликт в расписании
type ScheduleConflict struct {
	ID            string                 `json:"id"`
	Type          string                 `json:"type"`     // time_overlap, double_booking, time_off_conflict
	Severity      string                 `json:"severity"` // low, medium, high, critical
	Description   string                 `json:"description"`
	StaffID       string                 `json:"staff_id"`
	ConflictDate  time.Time              `json:"conflict_date"`
	ConflictTime  string                 `json:"conflict_time"`
	RelatedShifts []string               `json:"related_shifts"` // IDs связанных смен
	Metadata      map[string]interface{} `json:"metadata"`
	Status        string                 `json:"status"` // open, resolved, ignored
	ResolvedBy    string                 `json:"resolved_by"`
	ResolvedAt    *time.Time             `json:"resolved_at"`
	CreatedAt     time.Time              `json:"created_at"`
}

// IsResolved проверяет, решен ли конфликт
func (c *ScheduleConflict) IsResolved() bool {
	return c.Status == "resolved"
}

// IsCritical проверяет, критичен ли конфликт
func (c *ScheduleConflict) IsCritical() bool {
	return c.Severity == "critical" || c.Severity == "high"
}
