package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/ialekseychuk/my-place/internal/domain"
	"github.com/ialekseychuk/my-place/internal/dto"
)

type ScheduleService struct {
	scheduleRepo domain.ScheduleRepository
	staffRepo    domain.StaffRepository
}

func NewScheduleService(scheduleRepo domain.ScheduleRepository, staffRepo domain.StaffRepository) *ScheduleService {
	return &ScheduleService{
		scheduleRepo: scheduleRepo,
		staffRepo:    staffRepo,
	}
}

// =======================
// Schedule Template Management
// =======================

func (s *ScheduleService) CreateScheduleTemplate(ctx context.Context, req dto.CreateScheduleTemplateRequest) (*dto.ScheduleTemplateResponse, error) {
	// Validate that staff exists
	staff, err := s.staffRepo.GetById(ctx, req.StaffID)
	if err != nil {
		return nil, fmt.Errorf("staff not found: %w", err)
	}

	// Convert DTO to domain model
	template := &domain.ScheduleTemplate{
		StaffID:     req.StaffID,
		Name:        req.Name,
		Description: req.Description,
		IsDefault:   req.IsDefault,
		Schedule:    s.convertWeeklyScheduleTemplate(req.Schedule),
	}

	// If this is set as default, make sure no other template is default
	if req.IsDefault {
		if err := s.clearDefaultTemplate(ctx, req.StaffID); err != nil {
			return nil, fmt.Errorf("failed to clear existing default template: %w", err)
		}
	}

	// Create template
	if err := s.scheduleRepo.CreateScheduleTemplate(ctx, template); err != nil {
		return nil, fmt.Errorf("failed to create schedule template: %w", err)
	}

	// Convert to response DTO
	return &dto.ScheduleTemplateResponse{
		ID:          template.ID,
		StaffID:     template.StaffID,
		StaffName:   fmt.Sprintf("%s %s", staff.FirstName, staff.LastName),
		Name:        template.Name,
		Description: template.Description,
		IsDefault:   template.IsDefault,
		Schedule:    s.convertWeeklyScheduleTemplateToDTO(template.Schedule),
		CreatedAt:   template.CreatedAt,
		UpdatedAt:   template.UpdatedAt,
	}, nil
}

func (s *ScheduleService) GetScheduleTemplatesByStaff(ctx context.Context, staffID string) ([]dto.ScheduleTemplateResponse, error) {
	staff, err := s.staffRepo.GetById(ctx, staffID)
	if err != nil {
		return nil, fmt.Errorf("staff not found: %w", err)
	}

	templates, err := s.scheduleRepo.GetScheduleTemplatesByStaff(ctx, staffID)
	if err != nil {
		return nil, fmt.Errorf("failed to get schedule templates: %w", err)
	}

	responses := make([]dto.ScheduleTemplateResponse, len(templates))
	for i, template := range templates {
		responses[i] = dto.ScheduleTemplateResponse{
			ID:          template.ID,
			StaffID:     template.StaffID,
			StaffName:   fmt.Sprintf("%s %s", staff.FirstName, staff.LastName),
			Name:        template.Name,
			Description: template.Description,
			IsDefault:   template.IsDefault,
			Schedule:    s.convertWeeklyScheduleTemplateToDTO(template.Schedule),
			CreatedAt:   template.CreatedAt,
			UpdatedAt:   template.UpdatedAt,
		}
	}

	return responses, nil
}

// =======================
// Shift Management
// =======================

func (s *ScheduleService) CreateShift(ctx context.Context, req dto.CreateShiftRequest) (*dto.ShiftResponse, error) {
	// Validate staff exists
	staff, err := s.staffRepo.GetById(ctx, req.StaffID)
	if err != nil {
		return nil, fmt.Errorf("staff not found: %w", err)
	}

	// Parse shift date
	shiftDate, err := time.Parse("2006-01-02", req.ShiftDate)
	if err != nil {
		return nil, fmt.Errorf("invalid shift date format: %w", err)
	}

	// Validate time format and logic
	if err := s.validateShiftTimes(req.StartTime, req.EndTime, req.BreakStartTime, req.BreakEndTime); err != nil {
		return nil, err
	}

	// Check for conflicts
	if err := s.checkShiftConflicts(ctx, req.StaffID, shiftDate, req.StartTime, req.EndTime); err != nil {
		return nil, err
	}

	// Create shift domain model
	shift := &domain.StaffShift{
		StaffID:        req.StaffID,
		ShiftDate:      shiftDate,
		StartTime:      req.StartTime,
		EndTime:        req.EndTime,
		BreakStartTime: req.BreakStartTime,
		BreakEndTime:   req.BreakEndTime,
		IsAvailable:    true, // Default to available
		ShiftType:      req.ShiftType,
		Notes:          req.Notes,
		CreatedBy:      req.CreatedBy,
		UpdatedBy:      req.CreatedBy,
	}

	// Create shift
	if err := s.scheduleRepo.CreateShift(ctx, shift); err != nil {
		return nil, fmt.Errorf("failed to create shift: %w", err)
	}

	// Log availability action
	if err := s.logAvailabilityAction(ctx, shift.StaffID, shift.ID, "shift_created", false, true, "Shift created", req.CreatedBy); err != nil {
		// Log error but don't fail the operation
		fmt.Printf("Warning: failed to log availability action: %v\n", err)
	}

	// Convert to response DTO
	return &dto.ShiftResponse{
		ID:                  shift.ID,
		StaffID:             shift.StaffID,
		StaffName:           fmt.Sprintf("%s %s", staff.FirstName, staff.LastName),
		ShiftDate:           shift.ShiftDate.Format("2006-01-02"),
		StartTime:           shift.StartTime,
		EndTime:             shift.EndTime,
		BreakStartTime:      shift.BreakStartTime,
		BreakEndTime:        shift.BreakEndTime,
		IsAvailable:         shift.IsAvailable,
		IsManuallyDisabled:  shift.IsManuallyDisabled,
		ManualDisableReason: shift.ManualDisableReason,
		ShiftType:           shift.ShiftType,
		Notes:               shift.Notes,
		CreatedBy:           shift.CreatedBy,
		UpdatedBy:           shift.UpdatedBy,
		CreatedAt:           shift.CreatedAt,
		UpdatedAt:           shift.UpdatedAt,
	}, nil
}

func (s *ScheduleService) GetStaffShifts(ctx context.Context, staffID string, startDate, endDate time.Time) ([]dto.ShiftResponse, error) {
	staff, err := s.staffRepo.GetById(ctx, staffID)
	if err != nil {
		return nil, fmt.Errorf("staff not found: %w", err)
	}

	shifts, err := s.scheduleRepo.GetShiftsByStaff(ctx, staffID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get shifts: %w", err)
	}

	responses := make([]dto.ShiftResponse, len(shifts))
	for i, shift := range shifts {
		responses[i] = dto.ShiftResponse{
			ID:                  shift.ID,
			StaffID:             shift.StaffID,
			StaffName:           fmt.Sprintf("%s %s", staff.FirstName, staff.LastName),
			ShiftDate:           shift.ShiftDate.Format("2006-01-02"),
			StartTime:           shift.StartTime,
			EndTime:             shift.EndTime,
			BreakStartTime:      shift.BreakStartTime,
			BreakEndTime:        shift.BreakEndTime,
			IsAvailable:         shift.IsAvailable,
			IsManuallyDisabled:  shift.IsManuallyDisabled,
			ManualDisableReason: shift.ManualDisableReason,
			ShiftType:           shift.ShiftType,
			Notes:               shift.Notes,
			CreatedBy:           shift.CreatedBy,
			UpdatedBy:           shift.UpdatedBy,
			CreatedAt:           shift.CreatedAt,
			UpdatedAt:           shift.UpdatedAt,
		}
	}

	return responses, nil
}

// =======================
// Schedule Generation
// =======================

func (s *ScheduleService) GenerateSchedule(ctx context.Context, req dto.GenerateScheduleRequest) error {
	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		return fmt.Errorf("invalid start date format: %w", err)
	}

	endDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		return fmt.Errorf("invalid end date format: %w", err)
	}

	if endDate.Before(startDate) {
		return fmt.Errorf("end date cannot be before start date")
	}

	// Generate shifts for each staff member
	for _, staffID := range req.StaffIDs {
		if err := s.generateScheduleForStaff(ctx, staffID, startDate, endDate, req); err != nil {
			return fmt.Errorf("failed to generate schedule for staff %s: %w", staffID, err)
		}
	}

	return nil
}

func (s *ScheduleService) generateScheduleForStaff(ctx context.Context, staffID string, startDate, endDate time.Time, req dto.GenerateScheduleRequest) error {
	// If using template, get the template
	var template *domain.ScheduleTemplate
	if req.TemplateID != "" {
		var err error
		template, err = s.scheduleRepo.GetScheduleTemplate(ctx, req.TemplateID)
		if err != nil {
			return fmt.Errorf("failed to get schedule template: %w", err)
		}
	}

	// Generate shifts for each day in the range
	current := startDate
	for current.Before(endDate) || current.Equal(endDate) {
		// Check if we should overwrite existing shifts
		if !req.OverwriteExisting {
			existing, err := s.scheduleRepo.GetShiftsByStaff(ctx, staffID, current, current)
			if err != nil {
				return err
			}
			if len(existing) > 0 {
				current = current.AddDate(0, 0, 1)
				continue
			}
		}

		// Generate shifts for this day based on template or default
		if err := s.generateShiftsForDay(ctx, staffID, current, template, req.GeneratedBy); err != nil {
			return fmt.Errorf("failed to generate shifts for %s: %w", current.Format("2006-01-02"), err)
		}

		current = current.AddDate(0, 0, 1)
	}

	return nil
}

// =======================
// Availability Management
// =======================

func (s *ScheduleService) UpdateShiftAvailability(ctx context.Context, shiftID string, isAvailable bool, reason, updatedBy string) error {
	// Get the shift first
	shift, err := s.scheduleRepo.GetShift(ctx, shiftID)
	if err != nil {
		return fmt.Errorf("shift not found: %w", err)
	}

	previousStatus := !shift.IsManuallyDisabled

	// Update availability
	if err := s.scheduleRepo.UpdateShiftAvailability(ctx, shiftID, isAvailable, reason, updatedBy); err != nil {
		return fmt.Errorf("failed to update shift availability: %w", err)
	}

	// Log the action
	action := "enabled"
	if !isAvailable {
		action = "disabled"
	}

	if err := s.logAvailabilityAction(ctx, shift.StaffID, shiftID, action, previousStatus, isAvailable, reason, updatedBy); err != nil {
		fmt.Printf("Warning: failed to log availability action: %v\n", err)
	}

	return nil
}

func (s *ScheduleService) CheckStaffAvailability(ctx context.Context, staffID string, date time.Time, startTime, endTime string) (bool, string, error) {
	return s.scheduleRepo.CheckStaffAvailability(ctx, staffID, date, startTime, endTime)
}

// =======================
// Time Off Management
// =======================

func (s *ScheduleService) CreateTimeOffRequest(ctx context.Context, req dto.CreateTimeOffRequest) (*dto.TimeOffResponse, error) {
	// Validate staff exists
	staff, err := s.staffRepo.GetById(ctx, req.StaffID)
	if err != nil {
		return nil, fmt.Errorf("staff not found: %w", err)
	}

	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		return nil, fmt.Errorf("invalid start date format: %w", err)
	}

	endDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		return nil, fmt.Errorf("invalid end date format: %w", err)
	}

	if endDate.Before(startDate) {
		return nil, fmt.Errorf("end date cannot be before start date")
	}

	// Create time off request domain model
	timeOff := &domain.TimeOffRequest{
		StaffID:     req.StaffID,
		StartDate:   startDate,
		EndDate:     endDate,
		Type:        req.Type,
		Reason:      req.Reason,
		Status:      "pending", // Default status
		IsHalfDay:   req.IsHalfDay,
		HalfDayType: req.HalfDayType,
		RequestedBy: req.RequestedBy,
	}

	// Create time off request
	if err := s.scheduleRepo.CreateTimeOffRequest(ctx, timeOff); err != nil {
		return nil, fmt.Errorf("failed to create time off request: %w", err)
	}

	// Convert to response DTO
	return &dto.TimeOffResponse{
		ID:          timeOff.ID,
		StaffID:     timeOff.StaffID,
		StaffName:   fmt.Sprintf("%s %s", staff.FirstName, staff.LastName),
		StartDate:   timeOff.StartDate.Format("2006-01-02"),
		EndDate:     timeOff.EndDate.Format("2006-01-02"),
		Type:        timeOff.Type,
		Reason:      timeOff.Reason,
		Status:      timeOff.Status,
		IsHalfDay:   timeOff.IsHalfDay,
		HalfDayType: timeOff.HalfDayType,
		RequestedBy: timeOff.RequestedBy,
		RequestedAt: timeOff.RequestedAt,
	}, nil
}

// =======================
// Template Management Methods
// =======================

func (s *ScheduleService) GetScheduleTemplate(ctx context.Context, templateID string) (*dto.ScheduleTemplateResponse, error) {
	template, err := s.scheduleRepo.GetScheduleTemplate(ctx, templateID)
	if err != nil {
		return nil, fmt.Errorf("template not found: %w", err)
	}

	staff, err := s.staffRepo.GetById(ctx, template.StaffID)
	if err != nil {
		return nil, fmt.Errorf("staff not found: %w", err)
	}

	return &dto.ScheduleTemplateResponse{
		ID:          template.ID,
		StaffID:     template.StaffID,
		StaffName:   fmt.Sprintf("%s %s", staff.FirstName, staff.LastName),
		Name:        template.Name,
		Description: template.Description,
		IsDefault:   template.IsDefault,
		Schedule:    s.convertWeeklyScheduleTemplateToDTO(template.Schedule),
		CreatedAt:   template.CreatedAt,
		UpdatedAt:   template.UpdatedAt,
	}, nil
}

func (s *ScheduleService) UpdateScheduleTemplate(ctx context.Context, templateID string, req dto.UpdateScheduleTemplateRequest) (*dto.ScheduleTemplateResponse, error) {
	template, err := s.scheduleRepo.GetScheduleTemplate(ctx, templateID)
	if err != nil {
		return nil, fmt.Errorf("template not found: %w", err)
	}

	// Update fields if provided
	if req.Name != "" {
		template.Name = req.Name
	}
	if req.Description != "" {
		template.Description = req.Description
	}
	if req.IsDefault != nil {
		template.IsDefault = *req.IsDefault
		// If setting as default, clear other defaults for this staff
		if *req.IsDefault {
			if err := s.clearDefaultTemplate(ctx, template.StaffID); err != nil {
				return nil, fmt.Errorf("failed to clear existing default template: %w", err)
			}
		}
	}
	if req.Schedule != nil {
		template.Schedule = s.convertWeeklyScheduleTemplate(*req.Schedule)
	}

	if err := s.scheduleRepo.UpdateScheduleTemplate(ctx, template); err != nil {
		return nil, fmt.Errorf("failed to update template: %w", err)
	}

	staff, err := s.staffRepo.GetById(ctx, template.StaffID)
	if err != nil {
		return nil, fmt.Errorf("staff not found: %w", err)
	}

	return &dto.ScheduleTemplateResponse{
		ID:          template.ID,
		StaffID:     template.StaffID,
		StaffName:   fmt.Sprintf("%s %s", staff.FirstName, staff.LastName),
		Name:        template.Name,
		Description: template.Description,
		IsDefault:   template.IsDefault,
		Schedule:    s.convertWeeklyScheduleTemplateToDTO(template.Schedule),
		CreatedAt:   template.CreatedAt,
		UpdatedAt:   template.UpdatedAt,
	}, nil
}

func (s *ScheduleService) DeleteScheduleTemplate(ctx context.Context, templateID string) error {
	if err := s.scheduleRepo.DeleteScheduleTemplate(ctx, templateID); err != nil {
		return fmt.Errorf("failed to delete template: %w", err)
	}
	return nil
}

func (s *ScheduleService) SetDefaultTemplate(ctx context.Context, staffID, templateID string) error {
	// Clear existing default for this staff
	if err := s.clearDefaultTemplate(ctx, staffID); err != nil {
		return fmt.Errorf("failed to clear existing default template: %w", err)
	}

	// Set new default
	if err := s.scheduleRepo.SetDefaultTemplate(ctx, staffID, templateID); err != nil {
		return fmt.Errorf("failed to set template as default: %w", err)
	}

	return nil
}

// =======================
// Shift Management Methods
// =======================

func (s *ScheduleService) GetShift(ctx context.Context, shiftID string) (*dto.ShiftResponse, error) {
	shift, err := s.scheduleRepo.GetShift(ctx, shiftID)
	if err != nil {
		return nil, fmt.Errorf("shift not found: %w", err)
	}

	staff, err := s.staffRepo.GetById(ctx, shift.StaffID)
	if err != nil {
		return nil, fmt.Errorf("staff not found: %w", err)
	}

	return &dto.ShiftResponse{
		ID:                  shift.ID,
		StaffID:             shift.StaffID,
		StaffName:           fmt.Sprintf("%s %s", staff.FirstName, staff.LastName),
		ShiftDate:           shift.ShiftDate.Format("2006-01-02"),
		StartTime:           shift.StartTime,
		EndTime:             shift.EndTime,
		BreakStartTime:      shift.BreakStartTime,
		BreakEndTime:        shift.BreakEndTime,
		IsAvailable:         shift.IsAvailable,
		IsManuallyDisabled:  shift.IsManuallyDisabled,
		ManualDisableReason: shift.ManualDisableReason,
		ShiftType:           shift.ShiftType,
		Notes:               shift.Notes,
		CreatedBy:           shift.CreatedBy,
		UpdatedBy:           shift.UpdatedBy,
		CreatedAt:           shift.CreatedAt,
		UpdatedAt:           shift.UpdatedAt,
	}, nil
}

func (s *ScheduleService) UpdateShift(ctx context.Context, shiftID string, req dto.UpdateShiftRequest) (*dto.ShiftResponse, error) {
	shift, err := s.scheduleRepo.GetShift(ctx, shiftID)
	if err != nil {
		return nil, fmt.Errorf("shift not found: %w", err)
	}

	// Update fields if provided
	if req.StartTime != "" {
		shift.StartTime = req.StartTime
	}
	if req.EndTime != "" {
		shift.EndTime = req.EndTime
	}
	if req.BreakStartTime != "" {
		shift.BreakStartTime = req.BreakStartTime
	}
	if req.BreakEndTime != "" {
		shift.BreakEndTime = req.BreakEndTime
	}
	if req.ShiftType != "" {
		shift.ShiftType = req.ShiftType
	}
	if req.Notes != "" {
		shift.Notes = req.Notes
	}
	if req.IsAvailable != nil {
		shift.IsAvailable = *req.IsAvailable
	}
	shift.UpdatedBy = req.UpdatedBy

	// Validate times if changed
	if req.StartTime != "" || req.EndTime != "" {
		if err := s.validateShiftTimes(shift.StartTime, shift.EndTime, shift.BreakStartTime, shift.BreakEndTime); err != nil {
			return nil, err
		}
	}

	if err := s.scheduleRepo.UpdateShift(ctx, shift); err != nil {
		return nil, fmt.Errorf("failed to update shift: %w", err)
	}

	return s.GetShift(ctx, shiftID)
}

func (s *ScheduleService) DeleteShift(ctx context.Context, shiftID string) error {
	if err := s.scheduleRepo.DeleteShift(ctx, shiftID); err != nil {
		return fmt.Errorf("failed to delete shift: %w", err)
	}
	return nil
}

// =======================
// Bulk Operations
// =======================

func (s *ScheduleService) BulkCreateShifts(ctx context.Context, req dto.BulkCreateShiftsRequest) ([]dto.ShiftResponse, error) {
	var responses []dto.ShiftResponse

	for _, shiftReq := range req.Shifts {
		shift, err := s.CreateShift(ctx, shiftReq)
		if err != nil {
			return nil, fmt.Errorf("failed to create shift for staff %s on %s: %w", shiftReq.StaffID, shiftReq.ShiftDate, err)
		}
		responses = append(responses, *shift)
	}

	return responses, nil
}

func (s *ScheduleService) BulkUpdateShifts(ctx context.Context, req dto.BulkUpdateShiftsRequest) ([]dto.ShiftResponse, error) {
	var responses []dto.ShiftResponse

	for _, update := range req.Updates {
		shift, err := s.UpdateShift(ctx, update.ShiftID, update.Update)
		if err != nil {
			return nil, fmt.Errorf("failed to update shift %s: %w", update.ShiftID, err)
		}
		responses = append(responses, *shift)
	}

	return responses, nil
}

func (s *ScheduleService) BulkDeleteShifts(ctx context.Context, req dto.BulkDeleteShiftsRequest) error {
	for _, shiftID := range req.ShiftIDs {
		if err := s.DeleteShift(ctx, shiftID); err != nil {
			return fmt.Errorf("failed to delete shift %s: %w", shiftID, err)
		}
	}
	return nil
}

// =======================
// Helper Methods
// =======================

func (s *ScheduleService) clearDefaultTemplate(ctx context.Context, staffID string) error {
	// This would require a repository method to clear default flags
	// For now, we'll implement this as a placeholder
	return nil
}

// Additional calculation helper
func (s *ScheduleService) calculateShiftHours(startTime, endTime, breakStart, breakEnd string) float64 {
	start, _ := time.Parse("15:04", startTime)
	end, _ := time.Parse("15:04", endTime)
	totalMinutes := end.Sub(start).Minutes()

	if breakStart != "" && breakEnd != "" {
		bStart, _ := time.Parse("15:04", breakStart)
		bEnd, _ := time.Parse("15:04", breakEnd)
		breakMinutes := bEnd.Sub(bStart).Minutes()
		totalMinutes -= breakMinutes
	}

	return totalMinutes / 60.0
}

// =======================
// Time Off Management Methods
// =======================

func (s *ScheduleService) GetTimeOffRequest(ctx context.Context, requestID string) (*dto.TimeOffResponse, error) {
	timeOff, err := s.scheduleRepo.GetTimeOffRequest(ctx, requestID)
	if err != nil {
		return nil, fmt.Errorf("time off request not found: %w", err)
	}

	staff, err := s.staffRepo.GetById(ctx, timeOff.StaffID)
	if err != nil {
		return nil, fmt.Errorf("staff not found: %w", err)
	}

	response := &dto.TimeOffResponse{
		ID:          timeOff.ID,
		StaffID:     timeOff.StaffID,
		StaffName:   fmt.Sprintf("%s %s", staff.FirstName, staff.LastName),
		StartDate:   timeOff.StartDate.Format("2006-01-02"),
		EndDate:     timeOff.EndDate.Format("2006-01-02"),
		Type:        timeOff.Type,
		Reason:      timeOff.Reason,
		Status:      timeOff.Status,
		IsHalfDay:   timeOff.IsHalfDay,
		HalfDayType: timeOff.HalfDayType,
		RequestedBy: timeOff.RequestedBy,
		ApprovedBy:  timeOff.ApprovedBy,
		Comments:    timeOff.Comments,
		RequestedAt: timeOff.RequestedAt,
	}

	if timeOff.ProcessedAt != nil {
		response.ProcessedAt = timeOff.ProcessedAt
	}

	return response, nil
}

func (s *ScheduleService) UpdateTimeOffRequest(ctx context.Context, requestID string, req dto.UpdateTimeOffRequest) (*dto.TimeOffResponse, error) {
	timeOff, err := s.scheduleRepo.GetTimeOffRequest(ctx, requestID)
	if err != nil {
		return nil, fmt.Errorf("time off request not found: %w", err)
	}

	// Update fields if provided
	if req.Status != "" {
		timeOff.Status = req.Status
		now := time.Now()
		timeOff.ProcessedAt = &now
	}
	if req.ApprovalBy != "" {
		timeOff.ApprovedBy = req.ApprovalBy
	}
	if req.Comments != "" {
		timeOff.Comments = req.Comments
	}

	if err := s.scheduleRepo.UpdateTimeOffRequest(ctx, timeOff); err != nil {
		return nil, fmt.Errorf("failed to update time off request: %w", err)
	}

	return s.GetTimeOffRequest(ctx, requestID)
}

func (s *ScheduleService) DeleteTimeOffRequest(ctx context.Context, requestID string) error {
	if err := s.scheduleRepo.DeleteTimeOffRequest(ctx, requestID); err != nil {
		return fmt.Errorf("failed to delete time off request: %w", err)
	}
	return nil
}

func (s *ScheduleService) GetStaffTimeOffRequests(ctx context.Context, staffID string, startDate, endDate *time.Time) ([]dto.TimeOffResponse, error) {
	// Handle optional date parameters
	var start, end time.Time
	if startDate != nil {
		start = *startDate
	} else {
		// Default to 1 year ago
		start = time.Now().AddDate(-1, 0, 0)
	}
	if endDate != nil {
		end = *endDate
	} else {
		end = time.Now().AddDate(1, 0, 0) // 1 year in future
	}

	timeOffRequests, err := s.scheduleRepo.GetTimeOffRequestsByStaff(ctx, staffID, start, end)
	if err != nil {
		return nil, fmt.Errorf("failed to get time off requests: %w", err)
	}

	staff, err := s.staffRepo.GetById(ctx, staffID)
	if err != nil {
		return nil, fmt.Errorf("staff not found: %w", err)
	}

	responses := make([]dto.TimeOffResponse, len(timeOffRequests))
	for i, timeOff := range timeOffRequests {
		responses[i] = dto.TimeOffResponse{
			ID:          timeOff.ID,
			StaffID:     timeOff.StaffID,
			StaffName:   fmt.Sprintf("%s %s", staff.FirstName, staff.LastName),
			StartDate:   timeOff.StartDate.Format("2006-01-02"),
			EndDate:     timeOff.EndDate.Format("2006-01-02"),
			Type:        timeOff.Type,
			Reason:      timeOff.Reason,
			Status:      timeOff.Status,
			IsHalfDay:   timeOff.IsHalfDay,
			HalfDayType: timeOff.HalfDayType,
			RequestedBy: timeOff.RequestedBy,
			ApprovedBy:  timeOff.ApprovedBy,
			Comments:    timeOff.Comments,
			RequestedAt: timeOff.RequestedAt,
			ProcessedAt: timeOff.ProcessedAt,
		}
	}

	return responses, nil
}

func (s *ScheduleService) GetBusinessTimeOffRequests(ctx context.Context, businessID, status string, startDate, endDate *time.Time) ([]dto.TimeOffResponse, error) {
	// Handle optional date parameters
	var start, end time.Time
	if startDate != nil {
		start = *startDate
	} else {
		// Default to 1 year ago
		start = time.Now().AddDate(-1, 0, 0)
	}
	if endDate != nil {
		end = *endDate
	} else {
		end = time.Now().AddDate(1, 0, 0) // 1 year in future
	}

	timeOffRequests, err := s.scheduleRepo.GetTimeOffRequestsByBusiness(ctx, businessID, status, start, end)
	if err != nil {
		return nil, fmt.Errorf("failed to get time off requests: %w", err)
	}

	// Map staff IDs to names for efficiency
	staffMap := make(map[string]*domain.Staff)

	responses := make([]dto.TimeOffResponse, len(timeOffRequests))
	for i, timeOff := range timeOffRequests {
		// Get staff info if not cached
		if _, exists := staffMap[timeOff.StaffID]; !exists {
			staff, err := s.staffRepo.GetById(ctx, timeOff.StaffID)
			if err != nil {
				return nil, fmt.Errorf("staff not found for ID %s: %w", timeOff.StaffID, err)
			}
			staffMap[timeOff.StaffID] = staff
		}

		staff := staffMap[timeOff.StaffID]
		responses[i] = dto.TimeOffResponse{
			ID:          timeOff.ID,
			StaffID:     timeOff.StaffID,
			StaffName:   fmt.Sprintf("%s %s", staff.FirstName, staff.LastName),
			StartDate:   timeOff.StartDate.Format("2006-01-02"),
			EndDate:     timeOff.EndDate.Format("2006-01-02"),
			Type:        timeOff.Type,
			Reason:      timeOff.Reason,
			Status:      timeOff.Status,
			IsHalfDay:   timeOff.IsHalfDay,
			HalfDayType: timeOff.HalfDayType,
			RequestedBy: timeOff.RequestedBy,
			ApprovedBy:  timeOff.ApprovedBy,
			Comments:    timeOff.Comments,
			RequestedAt: timeOff.RequestedAt,
			ProcessedAt: timeOff.ProcessedAt,
		}
	}

	return responses, nil
}

func (s *ScheduleService) validateShiftTimes(startTime, endTime, breakStart, breakEnd string) error {
	// Parse times to validate format
	start, err := time.Parse("15:04", startTime)
	if err != nil {
		return fmt.Errorf("invalid start time format: %w", err)
	}

	end, err := time.Parse("15:04", endTime)
	if err != nil {
		return fmt.Errorf("invalid end time format: %w", err)
	}

	if end.Before(start) || end.Equal(start) {
		return fmt.Errorf("end time must be after start time")
	}

	// Validate break times if provided
	if breakStart != "" && breakEnd != "" {
		bStart, err := time.Parse("15:04", breakStart)
		if err != nil {
			return fmt.Errorf("invalid break start time format: %w", err)
		}

		bEnd, err := time.Parse("15:04", breakEnd)
		if err != nil {
			return fmt.Errorf("invalid break end time format: %w", err)
		}

		if bEnd.Before(bStart) || bEnd.Equal(bStart) {
			return fmt.Errorf("break end time must be after break start time")
		}

		if bStart.Before(start) || bEnd.After(end) {
			return fmt.Errorf("break time must be within shift hours")
		}
	}

	return nil
}

func (s *ScheduleService) checkShiftConflicts(ctx context.Context, staffID string, date time.Time, startTime, endTime string) error {
	// Get existing shifts for the day
	existing, err := s.scheduleRepo.GetShiftsByStaff(ctx, staffID, date, date)
	if err != nil {
		return fmt.Errorf("failed to check existing shifts: %w", err)
	}

	// Parse new shift times
	newStart, _ := time.Parse("15:04", startTime)
	newEnd, _ := time.Parse("15:04", endTime)

	// Check for time conflicts
	for _, shift := range existing {
		existingStart, _ := time.Parse("15:04", shift.StartTime)
		existingEnd, _ := time.Parse("15:04", shift.EndTime)

		// Check if times overlap
		if newStart.Before(existingEnd) && newEnd.After(existingStart) {
			return fmt.Errorf("shift conflicts with existing shift from %s to %s", shift.StartTime, shift.EndTime)
		}
	}

	return nil
}

func (s *ScheduleService) generateShiftsForDay(ctx context.Context, staffID string, date time.Time, template *domain.ScheduleTemplate, generatedBy string) error {
	// If no template provided, skip this day (could implement default logic here)
	if template == nil {
		return nil
	}

	// Get day of week (0=Sunday, 1=Monday, etc.)
	dayOfWeek := int(date.Weekday())
	var daySchedule domain.DayScheduleTemplate

	// Map weekday to template day
	switch dayOfWeek {
	case 0:
		daySchedule = template.Schedule.Sunday
	case 1:
		daySchedule = template.Schedule.Monday
	case 2:
		daySchedule = template.Schedule.Tuesday
	case 3:
		daySchedule = template.Schedule.Wednesday
	case 4:
		daySchedule = template.Schedule.Thursday
	case 5:
		daySchedule = template.Schedule.Friday
	case 6:
		daySchedule = template.Schedule.Saturday
	}

	// Skip non-working days
	if !daySchedule.IsWorkingDay {
		return nil
	}

	// Create shifts based on template
	if len(daySchedule.Shifts) > 0 {
		// Use defined shifts
		for _, shiftTemplate := range daySchedule.Shifts {
			shift := &domain.StaffShift{
				StaffID:        staffID,
				ShiftDate:      date,
				StartTime:      shiftTemplate.StartTime,
				EndTime:        shiftTemplate.EndTime,
				BreakStartTime: shiftTemplate.BreakStartTime,
				BreakEndTime:   shiftTemplate.BreakEndTime,
				IsAvailable:    true,
				ShiftType:      shiftTemplate.ShiftType,
				CreatedBy:      generatedBy,
				UpdatedBy:      generatedBy,
			}

			if err := s.scheduleRepo.CreateShift(ctx, shift); err != nil {
				return err
			}
		}
	} else {
		// Create single shift from day schedule
		shift := &domain.StaffShift{
			StaffID:        staffID,
			ShiftDate:      date,
			StartTime:      daySchedule.StartTime,
			EndTime:        daySchedule.EndTime,
			BreakStartTime: daySchedule.BreakStartTime,
			BreakEndTime:   daySchedule.BreakEndTime,
			IsAvailable:    true,
			ShiftType:      "regular",
			CreatedBy:      generatedBy,
			UpdatedBy:      generatedBy,
		}

		if err := s.scheduleRepo.CreateShift(ctx, shift); err != nil {
			return err
		}
	}

	return nil
}

func (s *ScheduleService) logAvailabilityAction(ctx context.Context, staffID, shiftID, action string, previousStatus, newStatus bool, reason, changedBy string) error {
	log := &domain.StaffAvailabilityLog{
		StaffID:        staffID,
		ShiftID:        shiftID,
		Action:         action,
		PreviousStatus: previousStatus,
		NewStatus:      newStatus,
		Reason:         reason,
		ChangedBy:      changedBy,
		Metadata:       make(map[string]interface{}),
	}

	return s.scheduleRepo.CreateAvailabilityLog(ctx, log)
}

// =======================
// Conversion Methods
// =======================

func (s *ScheduleService) convertWeeklyScheduleTemplate(dto dto.WeeklyScheduleTemplateDTO) domain.WeeklyScheduleTemplate {
	return domain.WeeklyScheduleTemplate{
		Monday:    s.convertDayScheduleTemplate(dto.Monday),
		Tuesday:   s.convertDayScheduleTemplate(dto.Tuesday),
		Wednesday: s.convertDayScheduleTemplate(dto.Wednesday),
		Thursday:  s.convertDayScheduleTemplate(dto.Thursday),
		Friday:    s.convertDayScheduleTemplate(dto.Friday),
		Saturday:  s.convertDayScheduleTemplate(dto.Saturday),
		Sunday:    s.convertDayScheduleTemplate(dto.Sunday),
	}
}

func (s *ScheduleService) convertDayScheduleTemplate(dto dto.DayScheduleTemplateDTO) domain.DayScheduleTemplate {
	shifts := make([]domain.ShiftTemplate, len(dto.Shifts))
	for i, shift := range dto.Shifts {
		shifts[i] = domain.ShiftTemplate{
			StartTime:      shift.StartTime,
			EndTime:        shift.EndTime,
			BreakStartTime: shift.BreakStartTime,
			BreakEndTime:   shift.BreakEndTime,
			ShiftType:      shift.ShiftType,
		}
	}

	return domain.DayScheduleTemplate{
		IsWorkingDay:   dto.IsWorkingDay,
		StartTime:      dto.StartTime,
		EndTime:        dto.EndTime,
		BreakStartTime: dto.BreakStartTime,
		BreakEndTime:   dto.BreakEndTime,
		Shifts:         shifts,
	}
}

func (s *ScheduleService) convertWeeklyScheduleTemplateToDTO(domain domain.WeeklyScheduleTemplate) dto.WeeklyScheduleTemplateDTO {
	return dto.WeeklyScheduleTemplateDTO{
		Monday:    s.convertDayScheduleTemplateToDTO(domain.Monday),
		Tuesday:   s.convertDayScheduleTemplateToDTO(domain.Tuesday),
		Wednesday: s.convertDayScheduleTemplateToDTO(domain.Wednesday),
		Thursday:  s.convertDayScheduleTemplateToDTO(domain.Thursday),
		Friday:    s.convertDayScheduleTemplateToDTO(domain.Friday),
		Saturday:  s.convertDayScheduleTemplateToDTO(domain.Saturday),
		Sunday:    s.convertDayScheduleTemplateToDTO(domain.Sunday),
	}
}

func (s *ScheduleService) convertDayScheduleTemplateToDTO(domain domain.DayScheduleTemplate) dto.DayScheduleTemplateDTO {
	shifts := make([]dto.ShiftTemplateDTO, len(domain.Shifts))
	for i, shift := range domain.Shifts {
		shifts[i] = dto.ShiftTemplateDTO{
			StartTime:      shift.StartTime,
			EndTime:        shift.EndTime,
			BreakStartTime: shift.BreakStartTime,
			BreakEndTime:   shift.BreakEndTime,
			ShiftType:      shift.ShiftType,
		}
	}

	return dto.DayScheduleTemplateDTO{
		IsWorkingDay:   domain.IsWorkingDay,
		StartTime:      domain.StartTime,
		EndTime:        domain.EndTime,
		BreakStartTime: domain.BreakStartTime,
		BreakEndTime:   domain.BreakEndTime,
		Shifts:         shifts,
	}
}

// =======================
// Schedule Views
// =======================

func (s *ScheduleService) GetWeeklyScheduleView(ctx context.Context, businessID string, weekStartDate time.Time, staffIDs []string) (*dto.WeeklyScheduleViewResponse, error) {
	weekEndDate := weekStartDate.AddDate(0, 0, 6)

	// If no specific staff IDs provided, get all staff for the business
	if len(staffIDs) == 0 {
		allStaff, err := s.staffRepo.ListByBusinessId(ctx, businessID)
		if err != nil {
			return nil, fmt.Errorf("failed to get staff for business: %w", err)
		}

		// Extract staff IDs from all staff
		for _, staff := range allStaff {
			staffIDs = append(staffIDs, staff.ID)
		}
	}

	var staffSchedules []dto.StaffWeeklyScheduleResponse
	for _, staffID := range staffIDs {
		staffSchedule, err := s.GetStaffWeeklySchedule(ctx, staffID, weekStartDate)
		if err != nil {
			return nil, fmt.Errorf("failed to get schedule for staff %s: %w", staffID, err)
		}
		staffSchedules = append(staffSchedules, *staffSchedule)
	}

	return &dto.WeeklyScheduleViewResponse{
		WeekStartDate:  weekStartDate.Format("2006-01-02"),
		WeekEndDate:    weekEndDate.Format("2006-01-02"),
		StaffSchedules: staffSchedules,
	}, nil
}

func (s *ScheduleService) GetMonthlyScheduleView(ctx context.Context, businessID string, year, month time.Time, staffIDs []string) (*dto.WeeklyScheduleViewResponse, error) {
	monthStart := time.Date(year.Year(), month.Month(), 1, 0, 0, 0, 0, time.UTC)
	return s.GetWeeklyScheduleView(ctx, businessID, monthStart, staffIDs)
}

func (s *ScheduleService) GetStaffWeeklySchedule(ctx context.Context, staffID string, weekStartDate time.Time) (*dto.StaffWeeklyScheduleResponse, error) {
	staff, err := s.staffRepo.GetById(ctx, staffID)
	if err != nil {
		return nil, fmt.Errorf("staff not found: %w", err)
	}

	weekEndDate := weekStartDate.AddDate(0, 0, 6)
	shifts, err := s.scheduleRepo.GetShiftsByStaff(ctx, staffID, weekStartDate, weekEndDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get shifts: %w", err)
	}

	daysMap := make(map[string]dto.DayScheduleResponse)
	totalHours := 0.0

	for _, shift := range shifts {
		dateStr := shift.ShiftDate.Format("2006-01-02")
		shiftHours := s.calculateShiftHours(shift.StartTime, shift.EndTime, shift.BreakStartTime, shift.BreakEndTime)
		totalHours += shiftHours

		shiftResponse := dto.ShiftResponse{
			ID:          shift.ID,
			StaffID:     shift.StaffID,
			StaffName:   fmt.Sprintf("%s %s", staff.FirstName, staff.LastName),
			ShiftDate:   shift.ShiftDate.Format("2006-01-02"),
			StartTime:   shift.StartTime,
			EndTime:     shift.EndTime,
			ShiftType:   shift.ShiftType,
			IsAvailable: shift.IsAvailable,
		}

		if daySchedule, exists := daysMap[dateStr]; exists {
			daySchedule.Shifts = append(daySchedule.Shifts, shiftResponse)
			daySchedule.TotalHours += shiftHours
			daysMap[dateStr] = daySchedule
		} else {
			daysMap[dateStr] = dto.DayScheduleResponse{
				Date:         dateStr,
				DayOfWeek:    shift.ShiftDate.Weekday().String(),
				IsWorkingDay: true,
				Shifts:       []dto.ShiftResponse{shiftResponse},
				TotalHours:   shiftHours,
			}
		}
	}

	return &dto.StaffWeeklyScheduleResponse{
		StaffID:    staffID,
		StaffName:  fmt.Sprintf("%s %s", staff.FirstName, staff.LastName),
		Position:   staff.Position,
		Days:       daysMap,
		TotalHours: totalHours,
	}, nil
}

func (s *ScheduleService) GetStaffDaySchedule(ctx context.Context, staffID string, date time.Time) (*dto.DayScheduleResponse, error) {
	shifts, err := s.scheduleRepo.GetShiftsByStaff(ctx, staffID, date, date)
	if err != nil {
		return nil, fmt.Errorf("failed to get shifts: %w", err)
	}

	staff, err := s.staffRepo.GetById(ctx, staffID)
	if err != nil {
		return nil, fmt.Errorf("staff not found: %w", err)
	}

	var shiftResponses []dto.ShiftResponse
	totalHours := 0.0

	for _, shift := range shifts {
		shiftHours := s.calculateShiftHours(shift.StartTime, shift.EndTime, shift.BreakStartTime, shift.BreakEndTime)
		totalHours += shiftHours

		shiftResponses = append(shiftResponses, dto.ShiftResponse{
			ID:          shift.ID,
			StaffID:     shift.StaffID,
			StaffName:   fmt.Sprintf("%s %s", staff.FirstName, staff.LastName),
			ShiftDate:   shift.ShiftDate.Format("2006-01-02"),
			StartTime:   shift.StartTime,
			EndTime:     shift.EndTime,
			ShiftType:   shift.ShiftType,
			IsAvailable: shift.IsAvailable,
		})
	}

	return &dto.DayScheduleResponse{
		Date:         date.Format("2006-01-02"),
		DayOfWeek:    date.Weekday().String(),
		IsWorkingDay: len(shifts) > 0,
		Shifts:       shiftResponses,
		TotalHours:   totalHours,
	}, nil
}

// =======================
// Statistics and Availability
// =======================

func (s *ScheduleService) GetAvailableStaff(ctx context.Context, businessID string, date time.Time, startTime, endTime string, excludeStaffIDs []string) ([]dto.StaffAvailabilityResponse, error) {
	// Placeholder implementation - would need business staff repository
	return []dto.StaffAvailabilityResponse{}, nil
}

func (s *ScheduleService) GetAvailabilityLogs(ctx context.Context, staffID string, startDate, endDate *time.Time, limit int) ([]dto.AvailabilityLogResponse, error) {
	// Handle optional date parameters - use default range if not provided
	var start, end time.Time
	if startDate != nil {
		start = *startDate
	} else {
		// Default to 30 days ago
		start = time.Now().AddDate(0, 0, -30)
	}
	if endDate != nil {
		end = *endDate
	} else {
		end = time.Now()
	}

	logs, err := s.scheduleRepo.GetAvailabilityLogs(ctx, staffID, start, end)
	if err != nil {
		return nil, fmt.Errorf("failed to get availability logs: %w", err)
	}

	// Apply limit if specified
	if limit > 0 && len(logs) > limit {
		logs = logs[:limit]
	}

	responses := make([]dto.AvailabilityLogResponse, len(logs))
	for i, log := range logs {
		responses[i] = dto.AvailabilityLogResponse{
			ID:             log.ID,
			StaffID:        log.StaffID,
			ShiftID:        log.ShiftID,
			Action:         log.Action,
			PreviousStatus: log.PreviousStatus,
			NewStatus:      log.NewStatus,
			Reason:         log.Reason,
			ActionBy:       log.ChangedBy,
			CreatedAt:      log.ChangedAt,
		}
	}

	return responses, nil
}

func (s *ScheduleService) QuickEnableStaff(ctx context.Context, staffID string, req dto.QuickStaffActionRequest) (int, error) {
	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		return 0, fmt.Errorf("invalid date format: %w", err)
	}

	shifts, err := s.scheduleRepo.GetShiftsByStaff(ctx, staffID, date, date)
	if err != nil {
		return 0, fmt.Errorf("failed to get shifts: %w", err)
	}

	count := 0
	for _, shift := range shifts {
		if !shift.IsAvailable {
			if err := s.UpdateShiftAvailability(ctx, shift.ID, true, req.Reason, req.ActionBy); err != nil {
				return count, fmt.Errorf("failed to enable shift %s: %w", shift.ID, err)
			}
			count++
		}
	}

	return count, nil
}

func (s *ScheduleService) QuickDisableStaff(ctx context.Context, staffID string, req dto.QuickStaffActionRequest) (int, error) {
	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		return 0, fmt.Errorf("invalid date format: %w", err)
	}

	shifts, err := s.scheduleRepo.GetShiftsByStaff(ctx, staffID, date, date)
	if err != nil {
		return 0, fmt.Errorf("failed to get shifts: %w", err)
	}

	count := 0
	for _, shift := range shifts {
		if shift.IsAvailable {
			if err := s.UpdateShiftAvailability(ctx, shift.ID, false, req.Reason, req.ActionBy); err != nil {
				return count, fmt.Errorf("failed to disable shift %s: %w", shift.ID, err)
			}
			count++
		}
	}

	return count, nil
}

func (s *ScheduleService) CopySchedule(ctx context.Context, businessID string, req dto.CopyScheduleRequest) (int, error) {
	sourceStart, err := time.Parse("2006-01-02", req.SourceStartDate)
	if err != nil {
		return 0, fmt.Errorf("invalid source start date: %w", err)
	}

	sourceEnd, err := time.Parse("2006-01-02", req.SourceEndDate)
	if err != nil {
		return 0, fmt.Errorf("invalid source end date: %w", err)
	}

	targetStart, err := time.Parse("2006-01-02", req.TargetStartDate)
	if err != nil {
		return 0, fmt.Errorf("invalid target start date: %w", err)
	}

	copiedCount := 0
	for _, staffID := range req.StaffIDs {
		shifts, err := s.scheduleRepo.GetShiftsByStaff(ctx, staffID, sourceStart, sourceEnd)
		if err != nil {
			return copiedCount, fmt.Errorf("failed to get source shifts for staff %s: %w", staffID, err)
		}

		dayOffset := int(targetStart.Sub(sourceStart).Hours() / 24)

		for _, shift := range shifts {
			newShiftDate := shift.ShiftDate.AddDate(0, 0, dayOffset)

			// Check if target shift already exists
			existing, _ := s.scheduleRepo.GetShiftsByStaff(ctx, staffID, newShiftDate, newShiftDate)
			if !req.OverwriteExisting && len(existing) > 0 {
				continue
			}

			newShift := &domain.StaffShift{
				StaffID:        staffID,
				ShiftDate:      newShiftDate,
				StartTime:      shift.StartTime,
				EndTime:        shift.EndTime,
				BreakStartTime: shift.BreakStartTime,
				BreakEndTime:   shift.BreakEndTime,
				IsAvailable:    shift.IsAvailable,
				ShiftType:      shift.ShiftType,
				Notes:          shift.Notes,
				CreatedBy:      req.ActionBy,
				UpdatedBy:      req.ActionBy,
			}

			if err := s.scheduleRepo.CreateShift(ctx, newShift); err != nil {
				return copiedCount, fmt.Errorf("failed to copy shift: %w", err)
			}
			copiedCount++
		}
	}

	return copiedCount, nil
}

func (s *ScheduleService) GetStaffScheduleStats(ctx context.Context, staffID string, startDate, endDate time.Time) (*dto.StaffScheduleStatsResponse, error) {
	staff, err := s.staffRepo.GetById(ctx, staffID)
	if err != nil {
		return nil, fmt.Errorf("staff not found: %w", err)
	}

	shifts, err := s.scheduleRepo.GetShiftsByStaff(ctx, staffID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get shifts: %w", err)
	}

	totalHours := 0.0
	overtimeHours := 0.0
	for _, shift := range shifts {
		hours := s.calculateShiftHours(shift.StartTime, shift.EndTime, shift.BreakStartTime, shift.BreakEndTime)
		totalHours += hours
		if shift.ShiftType == "overtime" {
			overtimeHours += hours
		}
	}

	timeOffRequests, _ := s.scheduleRepo.GetTimeOffRequestsByStaff(ctx, staffID, startDate, endDate)
	vacationDays := 0
	sickDays := 0
	totalTimeOffDays := len(timeOffRequests)

	for _, timeOff := range timeOffRequests {
		if timeOff.Status == "approved" {
			switch timeOff.Type {
			case "vacation":
				vacationDays++
			case "sick_leave":
				sickDays++
			}
		}
	}

	daysInPeriod := int(endDate.Sub(startDate).Hours()/24) + 1
	averageHours := 0.0
	if len(shifts) > 0 {
		averageHours = totalHours / float64(len(shifts))
	}

	return &dto.StaffScheduleStatsResponse{
		StaffID:            staffID,
		StaffName:          fmt.Sprintf("%s %s", staff.FirstName, staff.LastName),
		PeriodStart:        startDate.Format("2006-01-02"),
		PeriodEnd:          endDate.Format("2006-01-02"),
		TotalShifts:        len(shifts),
		TotalWorkingHours:  totalHours,
		TotalOvertimeHours: overtimeHours,
		AverageHoursPerDay: averageHours,
		TotalTimeOffDays:   totalTimeOffDays,
		VacationDays:       vacationDays,
		SickLeaveDays:      sickDays,
		UtilizationRate:    totalHours / float64(daysInPeriod*8) * 100, // Assuming 8 hour work days
	}, nil
}

func (s *ScheduleService) GetBusinessScheduleStats(ctx context.Context, businessID string, startDate, endDate time.Time, includeStaffBreakdown bool) (*dto.BusinessScheduleStatsResponse, error) {
	// Placeholder implementation - would need to get all business staff
	return &dto.BusinessScheduleStatsResponse{
		BusinessID:           businessID,
		PeriodStart:          startDate.Format("2006-01-02"),
		PeriodEnd:            endDate.Format("2006-01-02"),
		TotalStaff:           0,
		TotalShifts:          0,
		TotalWorkingHours:    0,
		TotalOvertimeHours:   0,
		AverageHoursPerStaff: 0,
		TotalTimeOffRequests: 0,
		StaffBreakdown:       []dto.StaffScheduleStatsResponse{},
	}, nil
}
