package domain

import (
	"context"
	"time"

)

// ScheduleRepository интерфейс для работы с расписанием сотрудников
type ScheduleRepository interface {
	// Schedule Templates
	CreateScheduleTemplate(ctx context.Context, template *ScheduleTemplate) error
	GetScheduleTemplate(ctx context.Context, id string) (*ScheduleTemplate, error)
	GetScheduleTemplatesByStaff(ctx context.Context, staffID string) ([]ScheduleTemplate, error)
	UpdateScheduleTemplate(ctx context.Context, template *ScheduleTemplate) error
	DeleteScheduleTemplate(ctx context.Context, id string) error
	SetDefaultTemplate(ctx context.Context, staffID, templateID string) error

	// Staff Shifts
	CreateShift(ctx context.Context, shift *StaffShift) error
	GetShift(ctx context.Context, id string) (*StaffShift, error)
	GetShiftsByStaff(ctx context.Context, staffID string, startDate, endDate time.Time) ([]StaffShift, error)
	GetShiftsByBusiness(ctx context.Context, businessID string, startDate, endDate time.Time) ([]StaffShift, error)
	UpdateShift(ctx context.Context, shift *StaffShift) error
	DeleteShift(ctx context.Context, id string) error
	BulkCreateShifts(ctx context.Context, shifts []StaffShift) error
	BulkUpdateShifts(ctx context.Context, shiftIDs []string, updates map[string]interface{}) error
	BulkDeleteShifts(ctx context.Context, shiftIDs []string) error

	// Availability Management
	UpdateShiftAvailability(ctx context.Context, shiftID string, isAvailable bool, reason, updatedBy string) error
	GetAvailableStaff(ctx context.Context, businessID string, date time.Time, startTime, endTime string) ([]Staff, error)
	CheckStaffAvailability(ctx context.Context, staffID string, date time.Time, startTime, endTime string) (bool, string, error)

	// Time Off Management
	CreateTimeOffRequest(ctx context.Context, request *TimeOffRequest) error
	GetTimeOffRequest(ctx context.Context, id string) (*TimeOffRequest, error)
	GetTimeOffRequestsByStaff(ctx context.Context, staffID string, startDate, endDate time.Time) ([]TimeOffRequest, error)
	GetTimeOffRequestsByBusiness(ctx context.Context, businessID string, status string, startDate, endDate time.Time) ([]TimeOffRequest, error)
	UpdateTimeOffRequest(ctx context.Context, request *TimeOffRequest) error
	DeleteTimeOffRequest(ctx context.Context, id string) error

	// Schedule Views
	GetWeeklyScheduleView(ctx context.Context, businessID string, weekStartDate time.Time, staffIDs []string) (*WeeklyScheduleView, error)
	GetStaffWeeklySchedule(ctx context.Context, staffID string, weekStartDate time.Time) (*StaffWeeklySchedule, error)
	GetDayScheduleView(ctx context.Context, staffID string, date time.Time) (*DayScheduleView, error)

	// Statistics
	GetScheduleStats(ctx context.Context, staffID string, startDate, endDate time.Time) (*ScheduleStats, error)
	GetBusinessScheduleStats(ctx context.Context, businessID string, startDate, endDate time.Time) ([]ScheduleStats, error)

	// Conflict Detection
	DetectScheduleConflicts(ctx context.Context, businessID string, startDate, endDate time.Time) ([]ScheduleConflict, error)
	CreateScheduleConflict(ctx context.Context, conflict *ScheduleConflict) error
	ResolveScheduleConflict(ctx context.Context, conflictID, resolvedBy string) error

	// Recurring Patterns
	CreateRecurringPattern(ctx context.Context, pattern *RecurringSchedulePattern) error
	GetRecurringPatternsByStaff(ctx context.Context, staffID string) ([]RecurringSchedulePattern, error)
	UpdateRecurringPattern(ctx context.Context, pattern *RecurringSchedulePattern) error
	DeleteRecurringPattern(ctx context.Context, id string) error

	// Availability Logs
	CreateAvailabilityLog(ctx context.Context, log *StaffAvailabilityLog) error
	GetAvailabilityLogs(ctx context.Context, staffID string, startDate, endDate time.Time) ([]StaffAvailabilityLog, error)
}
