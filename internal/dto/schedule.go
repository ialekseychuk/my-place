package dto

import "time"

// =======================
// Schedule Template DTOs
// =======================

// CreateScheduleTemplateRequest для создания шаблона расписания
type CreateScheduleTemplateRequest struct {
	StaffID     string                    `json:"staff_id" validate:"required,uuid4"`
	Name        string                    `json:"name" validate:"required,min=3,max=100"`
	Description string                    `json:"description" validate:"omitempty,max=500"`
	IsDefault   bool                      `json:"is_default"`
	Schedule    WeeklyScheduleTemplateDTO `json:"schedule" validate:"required"`
}

// UpdateScheduleTemplateRequest для обновления шаблона расписания
type UpdateScheduleTemplateRequest struct {
	Name        string                     `json:"name" validate:"omitempty,min=3,max=100"`
	Description string                     `json:"description" validate:"omitempty,max=500"`
	IsDefault   *bool                      `json:"is_default" validate:"omitempty"`
	Schedule    *WeeklyScheduleTemplateDTO `json:"schedule" validate:"omitempty"`
}

// WeeklyScheduleTemplateDTO представляет недельный шаблон расписания
type WeeklyScheduleTemplateDTO struct {
	Monday    DayScheduleTemplateDTO `json:"monday"`
	Tuesday   DayScheduleTemplateDTO `json:"tuesday"`
	Wednesday DayScheduleTemplateDTO `json:"wednesday"`
	Thursday  DayScheduleTemplateDTO `json:"thursday"`
	Friday    DayScheduleTemplateDTO `json:"friday"`
	Saturday  DayScheduleTemplateDTO `json:"saturday"`
	Sunday    DayScheduleTemplateDTO `json:"sunday"`
}

// DayScheduleTemplateDTO представляет расписание на один день
type DayScheduleTemplateDTO struct {
	IsWorkingDay   bool               `json:"is_working_day"`
	StartTime      string             `json:"start_time" validate:"omitempty,len=5"`       // "09:00"
	EndTime        string             `json:"end_time" validate:"omitempty,len=5"`         // "18:00"
	BreakStartTime string             `json:"break_start_time" validate:"omitempty,len=5"` // "12:00"
	BreakEndTime   string             `json:"break_end_time" validate:"omitempty,len=5"`   // "13:00"
	Shifts         []ShiftTemplateDTO `json:"shifts" validate:"omitempty,dive"`
}

// ShiftTemplateDTO представляет шаблон смены в рамках дня
type ShiftTemplateDTO struct {
	StartTime      string `json:"start_time" validate:"required,len=5"`
	EndTime        string `json:"end_time" validate:"required,len=5"`
	BreakStartTime string `json:"break_start_time" validate:"omitempty,len=5"`
	BreakEndTime   string `json:"break_end_time" validate:"omitempty,len=5"`
	ShiftType      string `json:"shift_type" validate:"oneof=regular overtime"`
}

// ScheduleTemplateResponse для возврата шаблона расписания
type ScheduleTemplateResponse struct {
	ID          string                    `json:"id"`
	StaffID     string                    `json:"staff_id"`
	StaffName   string                    `json:"staff_name"`
	Name        string                    `json:"name"`
	Description string                    `json:"description"`
	IsDefault   bool                      `json:"is_default"`
	Schedule    WeeklyScheduleTemplateDTO `json:"schedule"`
	CreatedAt   time.Time                 `json:"created_at"`
	UpdatedAt   time.Time                 `json:"updated_at"`
}

// =======================
// Shift Management DTOs
// =======================

// CreateShiftRequest для создания конкретной смены
type CreateShiftRequest struct {
	StaffID        string `json:"staff_id" validate:"required,uuid4"`
	ShiftDate      string `json:"shift_date" validate:"required,len=10"` // "2025-01-15"
	StartTime      string `json:"start_time" validate:"required,len=5"`  // "09:00"
	EndTime        string `json:"end_time" validate:"required,len=5"`    // "18:00"
	BreakStartTime string `json:"break_start_time" validate:"omitempty,len=5"`
	BreakEndTime   string `json:"break_end_time" validate:"omitempty,len=5"`
	ShiftType      string `json:"shift_type" validate:"oneof=regular overtime holiday emergency"`
	Notes          string `json:"notes" validate:"omitempty,max=500"`
	CreatedBy      string `json:"created_by" validate:"required,len=32,hexadecimal"`
}

// UpdateShiftRequest для обновления смены
type UpdateShiftRequest struct {
	StartTime      string `json:"start_time" validate:"omitempty,len=5"`
	EndTime        string `json:"end_time" validate:"omitempty,len=5"`
	BreakStartTime string `json:"break_start_time" validate:"omitempty,len=5"`
	BreakEndTime   string `json:"break_end_time" validate:"omitempty,len=5"`
	ShiftType      string `json:"shift_type" validate:"omitempty,oneof=regular overtime holiday emergency"`
	Notes          string `json:"notes" validate:"omitempty,max=500"`
	IsAvailable    *bool  `json:"is_available" validate:"omitempty"`
	UpdatedBy      string `json:"updated_by" validate:"required,len=32,hexadecimal"`
}

// UpdateShiftAvailabilityRequest для обновления доступности смены
type UpdateShiftAvailabilityRequest struct {
	IsAvailable bool   `json:"is_available" validate:"required"`
	Reason      string `json:"reason" validate:"omitempty,max=500"`
	ActionBy    string `json:"action_by" validate:"required,len=32,hexadecimal"`
}

// ShiftResponse для возврата информации о смене
type ShiftResponse struct {
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
	CreatedBy           string    `json:"created_by,omitempty"`
	UpdatedBy           string    `json:"updated_by,omitempty"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

// =======================
// Schedule Generation DTOs
// =======================

// GenerateScheduleRequest для генерации расписания на период
type GenerateScheduleRequest struct {
	StaffIDs          []string `json:"staff_ids" validate:"required,min=1,dive,uuid4"`
	StartDate         string   `json:"start_date" validate:"required,len=10"`
	EndDate           string   `json:"end_date" validate:"required,len=10"`
	UseTemplate       bool     `json:"use_template"`
	TemplateID        string   `json:"template_id" validate:"omitempty,uuid4"`
	OverwriteExisting bool     `json:"overwrite_existing"`
	GeneratedBy       string   `json:"generated_by" validate:"required,len=32,hexadecimal"`
}

// BulkShiftOperationRequest для массовых операций с сменами
type BulkShiftOperationRequest struct {
	ShiftIDs  []string `json:"shift_ids" validate:"required,min=1,dive,uuid4"`
	Operation string   `json:"operation" validate:"required,oneof=enable disable delete"`
	Reason    string   `json:"reason" validate:"required,max=500"`
	ActionBy  string   `json:"action_by" validate:"required,len=32,hexadecimal"`
}

// =======================
// Time Off Management DTOs
// =======================

// CreateTimeOffRequest для создания заявки на отпуск/отгул
type CreateTimeOffRequest struct {
	StaffID     string `json:"staff_id" validate:"required,uuid4"`
	StartDate   string `json:"start_date" validate:"required,len=10"`
	EndDate     string `json:"end_date" validate:"required,len=10"`
	Type        string `json:"type" validate:"required,oneof=vacation sick_leave personal_day emergency"`
	Reason      string `json:"reason" validate:"required,max=500"`
	IsHalfDay   bool   `json:"is_half_day"`
	HalfDayType string `json:"half_day_type" validate:"omitempty,oneof=morning afternoon"`
	RequestedBy string `json:"requested_by" validate:"required,len=32,hexadecimal"`
}

// UpdateTimeOffRequest для обновления заявки на отпуск
type UpdateTimeOffRequest struct {
	Status     string `json:"status" validate:"omitempty,oneof=pending approved rejected cancelled"`
	ApprovalBy string `json:"approval_by" validate:"omitempty,len=32,hexadecimal"`
	Comments   string `json:"comments" validate:"omitempty,max=500"`
}

// TimeOffResponse для возврата информации об отпуске
type TimeOffResponse struct {
	ID          string     `json:"id"`
	StaffID     string     `json:"staff_id"`
	StaffName   string     `json:"staff_name"`
	StartDate   string     `json:"start_date"`
	EndDate     string     `json:"end_date"`
	Type        string     `json:"type"`
	Reason      string     `json:"reason"`
	Status      string     `json:"status"`
	IsHalfDay   bool       `json:"is_half_day"`
	HalfDayType string     `json:"half_day_type,omitempty"`
	RequestedBy string     `json:"requested_by"`
	ApprovedBy  string     `json:"approved_by,omitempty"`
	Comments    string     `json:"comments,omitempty"`
	RequestedAt time.Time  `json:"requested_at"`
	ProcessedAt *time.Time `json:"processed_at,omitempty"`
}

// =======================
// Calendar and View DTOs
// =======================

// WeeklyScheduleViewRequest для получения расписания на неделю
type WeeklyScheduleViewRequest struct {
	WeekStartDate  string   `json:"week_start_date" validate:"required,len=10"`
	StaffIDs       []string `json:"staff_ids" validate:"omitempty,dive,uuid4"`
	IncludeTimeOff bool     `json:"include_time_off"`
}

// WeeklyScheduleViewResponse для возврата недельного расписания
type WeeklyScheduleViewResponse struct {
	WeekStartDate  string                        `json:"week_start_date"`
	WeekEndDate    string                        `json:"week_end_date"`
	StaffSchedules []StaffWeeklyScheduleResponse `json:"staff_schedules"`
}

// StaffWeeklyScheduleResponse расписание одного сотрудника на неделю
type StaffWeeklyScheduleResponse struct {
	StaffID    string                         `json:"staff_id"`
	StaffName  string                         `json:"staff_name"`
	Position   string                         `json:"position"`
	Days       map[string]DayScheduleResponse `json:"days"` // "2025-01-13" -> DayScheduleResponse
	TotalHours float64                        `json:"total_hours"`
	TimeOff    []TimeOffResponse              `json:"time_off,omitempty"`
}

// DayScheduleResponse расписание на один день
type DayScheduleResponse struct {
	Date          string          `json:"date"`
	DayOfWeek     string          `json:"day_of_week"`
	IsWorkingDay  bool            `json:"is_working_day"`
	Shifts        []ShiftResponse `json:"shifts"`
	TotalHours    float64         `json:"total_hours"`
	HasTimeOff    bool            `json:"has_time_off"`
	TimeOffReason string          `json:"time_off_reason,omitempty"`
}

// MonthlyScheduleViewRequest для получения расписания на месяц
type MonthlyScheduleViewRequest struct {
	Year         int      `json:"year" validate:"required,min=2020,max=2030"`
	Month        int      `json:"month" validate:"required,min=1,max=12"`
	StaffIDs     []string `json:"staff_ids" validate:"omitempty,dive,uuid4"`
	IncludeStats bool     `json:"include_stats"`
}

// =======================
// Statistics DTOs
// =======================

// ScheduleStatsResponse статистика по расписанию
type ScheduleStatsResponse struct {
	StaffID            string  `json:"staff_id"`
	StaffName          string  `json:"staff_name"`
	Period             string  `json:"period"`
	TotalWorkingDays   int     `json:"total_working_days"`
	TotalWorkingHours  float64 `json:"total_working_hours"`
	TotalOvertimeHours float64 `json:"total_overtime_hours"`
	VacationDays       int     `json:"vacation_days"`
	SickLeaveDays      int     `json:"sick_leave_days"`
	AverageHoursPerDay float64 `json:"average_hours_per_day"`
	UtilizationRate    float64 `json:"utilization_rate"` // % от общего доступного времени
}

// =======================
// Quick Actions DTOs
// =======================

// QuickScheduleActionRequest для быстрых действий с расписанием
type QuickScheduleActionRequest struct {
	StaffID   string `json:"staff_id" validate:"required,uuid4"`
	Date      string `json:"date" validate:"required,len=10"`
	Action    string `json:"action" validate:"required,oneof=enable_day disable_day copy_prev_week"`
	StartTime string `json:"start_time" validate:"omitempty,len=5"`
	EndTime   string `json:"end_time" validate:"omitempty,len=5"`
	Reason    string `json:"reason" validate:"required,max=500"`
	ActionBy  string `json:"action_by" validate:"required,len=32,hexadecimal"`
}

// CopyScheduleRequest для копирования расписания
type CopyScheduleRequest struct {
	SourceStartDate   string   `json:"source_start_date" validate:"required,len=10"`
	SourceEndDate     string   `json:"source_end_date" validate:"required,len=10"`
	TargetStartDate   string   `json:"target_start_date" validate:"required,len=10"`
	StaffIDs          []string `json:"staff_ids" validate:"required,min=1,dive,uuid4"`
	OverwriteExisting bool     `json:"overwrite_existing"`
	ActionBy          string   `json:"action_by" validate:"required,len=32,hexadecimal"`
}

// BulkCreateShiftsRequest для массового создания смен
type BulkCreateShiftsRequest struct {
	Shifts []CreateShiftRequest `json:"shifts" validate:"required,min=1,dive"`
}

// BulkUpdateShiftsRequest для массового обновления смен
type BulkUpdateShiftsRequest struct {
	Updates []struct {
		ShiftID string             `json:"shift_id" validate:"required,uuid4"`
		Update  UpdateShiftRequest `json:"update" validate:"required"`
	} `json:"updates" validate:"required,min=1,dive"`
}

// BulkDeleteShiftsRequest для массового удаления смен
type BulkDeleteShiftsRequest struct {
	ShiftIDs []string `json:"shift_ids" validate:"required,min=1,dive,uuid4"`
	Reason   string   `json:"reason" validate:"required,max=500"`
	ActionBy string   `json:"action_by" validate:"required,len=32,hexadecimal"`
}

// QuickStaffActionRequest для быстрых действий с сотрудником
type QuickStaffActionRequest struct {
	Date     string `json:"date" validate:"required,len=10"`
	Reason   string `json:"reason" validate:"required,max=500"`
	ActionBy string `json:"action_by" validate:"required,len=32,hexadecimal"`
}

// StaffAvailabilityResponse для ответа о доступности сотрудника
type StaffAvailabilityResponse struct {
	StaffID     string `json:"staff_id"`
	StaffName   string `json:"staff_name"`
	Position    string `json:"position"`
	IsAvailable bool   `json:"is_available"`
	Reason      string `json:"reason,omitempty"`
}

// AvailabilityLogResponse для логов доступности
type AvailabilityLogResponse struct {
	ID             string    `json:"id"`
	StaffID        string    `json:"staff_id"`
	ShiftID        string    `json:"shift_id,omitempty"`
	Action         string    `json:"action"`
	PreviousStatus bool      `json:"previous_status"`
	NewStatus      bool      `json:"new_status"`
	Reason         string    `json:"reason"`
	ActionBy       string    `json:"action_by"`
	CreatedAt      time.Time `json:"created_at"`
}

// StaffScheduleStatsResponse для статистики сотрудника
type StaffScheduleStatsResponse struct {
	StaffID            string  `json:"staff_id"`
	StaffName          string  `json:"staff_name"`
	PeriodStart        string  `json:"period_start"`
	PeriodEnd          string  `json:"period_end"`
	TotalShifts        int     `json:"total_shifts"`
	TotalWorkingHours  float64 `json:"total_working_hours"`
	TotalOvertimeHours float64 `json:"total_overtime_hours"`
	AverageHoursPerDay float64 `json:"average_hours_per_day"`
	TotalTimeOffDays   int     `json:"total_time_off_days"`
	VacationDays       int     `json:"vacation_days"`
	SickLeaveDays      int     `json:"sick_leave_days"`
	UtilizationRate    float64 `json:"utilization_rate"`
}

// BusinessScheduleStatsResponse для статистики бизнеса
type BusinessScheduleStatsResponse struct {
	BusinessID           string                       `json:"business_id"`
	PeriodStart          string                       `json:"period_start"`
	PeriodEnd            string                       `json:"period_end"`
	TotalStaff           int                          `json:"total_staff"`
	TotalShifts          int                          `json:"total_shifts"`
	TotalWorkingHours    float64                      `json:"total_working_hours"`
	TotalOvertimeHours   float64                      `json:"total_overtime_hours"`
	AverageHoursPerStaff float64                      `json:"average_hours_per_staff"`
	TotalTimeOffRequests int                          `json:"total_time_off_requests"`
	StaffBreakdown       []StaffScheduleStatsResponse `json:"staff_breakdown,omitempty"`
}
