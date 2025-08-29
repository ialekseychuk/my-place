package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/ialekseychuk/my-place/internal/dto"
	"github.com/ialekseychuk/my-place/internal/server/middleware"
	"github.com/ialekseychuk/my-place/internal/usecase"
	"github.com/ialekseychuk/my-place/pkg/validate"
)

type ScheduleHandler struct {
	scheduleService *usecase.ScheduleService
}

func NewScheduleHandler(scheduleService *usecase.ScheduleService) *ScheduleHandler {
	return &ScheduleHandler{
		scheduleService: scheduleService,
	}
}

func (h *ScheduleHandler) Routes() chi.Router {
	r := chi.NewRouter()

	// Schedule Templates
	r.Route("/templates", func(r chi.Router) {
		r.Post("/", h.CreateScheduleTemplate)
		r.Get("/{templateID}", h.GetScheduleTemplate)
		r.Put("/{templateID}", h.UpdateScheduleTemplate)
		r.Delete("/{templateID}", h.DeleteScheduleTemplate)
	})

	// Staff-specific schedule template routes
	r.Route("/staff/{staffID}/templates", func(r chi.Router) {
		r.Get("/", h.GetStaffScheduleTemplates)
		r.Post("/{templateID}/set-default", h.SetDefaultTemplate)
	})

	// Shifts Management
	r.Route("/shifts", func(r chi.Router) {
		r.Post("/", h.CreateShift)
		r.Get("/{shiftID}", h.GetShift)
		r.Put("/{shiftID}", h.UpdateShift)
		r.Delete("/{shiftID}", h.DeleteShift)
		r.Put("/{shiftID}/availability", h.UpdateShiftAvailability)

		// Bulk operations
		r.Post("/bulk", h.BulkCreateShifts)
		r.Put("/bulk", h.BulkUpdateShifts)
		r.Delete("/bulk", h.BulkDeleteShifts)
	})

	// Staff shifts
	r.Route("/staff/{staffID}/shifts", func(r chi.Router) {
		r.Get("/", h.GetStaffShifts)
		r.Post("/generate", h.GenerateStaffSchedule)
	})

	// Schedule Views
	r.Route("/views", func(r chi.Router) {
		r.Get("/weekly", h.GetWeeklyScheduleView)
		r.Get("/monthly", h.GetMonthlyScheduleView)
		r.Get("/staff/{staffID}/weekly", h.GetStaffWeeklySchedule)
		r.Get("/staff/{staffID}/day", h.GetStaffDaySchedule)
	})

	// Time Off Management
	r.Route("/time-off", func(r chi.Router) {
		r.Post("/", h.CreateTimeOffRequest)
		r.Get("/{requestID}", h.GetTimeOffRequest)
		r.Put("/{requestID}", h.UpdateTimeOffRequest)
		r.Delete("/{requestID}", h.DeleteTimeOffRequest)
		r.Get("/staff/{staffID}", h.GetStaffTimeOffRequests)
		r.Get("/business", h.GetBusinessTimeOffRequests)
	})

	// Availability
	r.Route("/availability", func(r chi.Router) {
		r.Get("/staff/{staffID}/check", h.CheckStaffAvailability)
		r.Get("/available-staff", h.GetAvailableStaff)
		r.Get("/logs/{staffID}", h.GetAvailabilityLogs)
	})

	// Quick Actions
	r.Route("/quick-actions", func(r chi.Router) {
		r.Post("/staff/{staffID}/enable", h.QuickEnableStaff)
		r.Post("/staff/{staffID}/disable", h.QuickDisableStaff)
		r.Post("/copy-schedule", h.CopySchedule)
	})

	// Statistics
	r.Route("/stats", func(r chi.Router) {
		r.Get("/staff/{staffID}", h.GetStaffScheduleStats)
		r.Get("/business", h.GetBusinessScheduleStats)
	})

	return r
}

// =======================
// Schedule Templates
// =======================

// @Summary Create schedule template
// @Description Create a new schedule template for staff
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param template body dto.CreateScheduleTemplateRequest true "Schedule template data"
// @Success 201 {object} dto.ScheduleTemplateResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/templates [post]
func (h *ScheduleHandler) CreateScheduleTemplate(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateScheduleTemplateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	template, err := h.scheduleService.CreateScheduleTemplate(r.Context(), req)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(template); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// @Summary Get staff schedule templates
// @Description Get all schedule templates for a staff member
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param staffID path string true "Staff ID"
// @Success 200 {array} dto.ScheduleTemplateResponse
// @Failure 404 {object} dto.ErrorResponse "Staff not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/staff/{staffID}/templates [get]
func (h *ScheduleHandler) GetStaffScheduleTemplates(w http.ResponseWriter, r *http.Request) {
	staffID := chi.URLParam(r, "staffID")
	if staffID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Staff ID is required")
		return
	}

	templates, err := h.scheduleService.GetScheduleTemplatesByStaff(r.Context(), staffID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := json.NewEncoder(w).Encode(templates); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// =======================
// Shift Management
// =======================

// @Summary Create shift
// @Description Create a new work shift for staff
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param shift body dto.CreateShiftRequest true "Shift data"
// @Success 201 {object} dto.ShiftResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 409 {object} dto.ErrorResponse "Schedule conflict"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/shifts [post]
func (h *ScheduleHandler) CreateShift(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateShiftRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	req.CreatedBy = middleware.GetUserFromContext(r.Context()).ID
	
	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	shift, err := h.scheduleService.CreateShift(r.Context(), req)
	if err != nil {
		// Check for specific error types
		if isConflictError(err) {
			ErrorResponse(w, http.StatusConflict, err.Error())
		} else {
			ErrorResponse(w, http.StatusInternalServerError, err.Error())
		}
		return
	}

	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(shift); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// @Summary Get staff shifts
// @Description Get shifts for a staff member within date range
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param staffID path string true "Staff ID"
// @Param location_id query string false "Location ID"
// @Param start_date query string true "Start date (YYYY-MM-DD)"
// @Param end_date query string true "End date (YYYY-MM-DD)"
// @Success 200 {array} dto.ShiftResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 404 {object} dto.ErrorResponse "Staff not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/staff/{staffID}/shifts [get]
func (h *ScheduleHandler) GetStaffShifts(w http.ResponseWriter, r *http.Request) {
	staffID := chi.URLParam(r, "staffID")
	if staffID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Staff ID is required")
		return
	}

	startDateStr := r.URL.Query().Get("start_date")
	endDateStr := r.URL.Query().Get("end_date")

	if startDateStr == "" || endDateStr == "" {
		ErrorResponse(w, http.StatusBadRequest, "start_date and end_date parameters are required")
		return
	}

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid start_date format, use YYYY-MM-DD")
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid end_date format, use YYYY-MM-DD")
		return
	}

	

	shifts, err := h.scheduleService.GetStaffShifts(r.Context(), staffID, startDate, endDate)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := json.NewEncoder(w).Encode(shifts); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// @Summary Update shift availability
// @Description Update the availability status of a shift
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param shiftID path string true "Shift ID"
// @Param availability body dto.UpdateShiftAvailabilityRequest true "Availability update data"
// @Success 200 {object} map[string]string
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 404 {object} dto.ErrorResponse "Shift not found"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/shifts/{shiftID}/availability [put]
func (h *ScheduleHandler) UpdateShiftAvailability(w http.ResponseWriter, r *http.Request) {
	shiftID := chi.URLParam(r, "shiftID")
	if shiftID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Shift ID is required")
		return
	}

	var req dto.UpdateShiftAvailabilityRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	err := h.scheduleService.UpdateShiftAvailability(r.Context(), shiftID, req.IsAvailable, req.Reason, req.ActionBy)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := json.NewEncoder(w).Encode(map[string]string{
		"message": "Shift availability updated successfully",
	}); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// =======================
// Schedule Generation
// =======================

// @Summary Generate staff schedule
// @Description Generate schedule for staff based on templates
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param staffID path string true "Staff ID"
// @Param generation body dto.GenerateScheduleRequest true "Schedule generation parameters"
// @Success 200 {object} map[string]string
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/staff/{staffID}/shifts/generate [post]
func (h *ScheduleHandler) GenerateStaffSchedule(w http.ResponseWriter, r *http.Request) {
	staffID := chi.URLParam(r, "staffID")
	if staffID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Staff ID is required")
		return
	}

	// Extract user from request context
	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		ErrorResponse(w, http.StatusUnauthorized, "User not found in context")
		return
	}

	var req dto.GenerateScheduleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Override staff IDs to only include the current staff member
	req.StaffIDs = []string{staffID}
	// Set the GeneratedBy field with the current user's ID
	req.GeneratedBy = user.ID

	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	err := h.scheduleService.GenerateSchedule(r.Context(), req)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := json.NewEncoder(w).Encode(map[string]string{
		"message": "Schedule generated successfully",
	}); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// =======================
// Time Off Management
// =======================

// @Summary Create time off request
// @Description Create a new time off request for staff
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param timeOff body dto.CreateTimeOffRequest true "Time off request data"
// @Success 201 {object} dto.TimeOffResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/time-off [post]
func (h *ScheduleHandler) CreateTimeOffRequest(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateTimeOffRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	timeOff, err := h.scheduleService.CreateTimeOffRequest(r.Context(), req)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(timeOff); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// =======================
// Availability Check
// =======================

// @Summary Check staff availability
// @Description Check if staff is available for a specific time slot
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param staffID path string true "Staff ID"
// @Param date query string true "Date (YYYY-MM-DD)"
// @Param start_time query string true "Start time (HH:MM)"
// @Param end_time query string true "End time (HH:MM)"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/availability/staff/{staffID}/check [get]
func (h *ScheduleHandler) CheckStaffAvailability(w http.ResponseWriter, r *http.Request) {
	staffID := chi.URLParam(r, "staffID")
	if staffID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Staff ID is required")
		return
	}

	dateStr := r.URL.Query().Get("date")
	startTime := r.URL.Query().Get("start_time")
	endTime := r.URL.Query().Get("end_time")

	if dateStr == "" || startTime == "" || endTime == "" {
		ErrorResponse(w, http.StatusBadRequest, "date, start_time, and end_time parameters are required")
		return
	}

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid date format, use YYYY-MM-DD")
		return
	}

	isAvailable, reason, err := h.scheduleService.CheckStaffAvailability(r.Context(), staffID, date, startTime, endTime)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := map[string]interface{}{
		"staff_id":     staffID,
		"date":         dateStr,
		"start_time":   startTime,
		"end_time":     endTime,
		"is_available": isAvailable,
		"reason":       reason,
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// =======================
// Placeholder methods for remaining endpoints
// =======================

// @Summary Get schedule template
// @Description Get a specific schedule template by ID
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param templateID path string true "Template ID"
// @Success 200 {object} dto.ScheduleTemplateResponse
// @Failure 404 {object} dto.ErrorResponse "Template not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/templates/{templateID} [get]
func (h *ScheduleHandler) GetScheduleTemplate(w http.ResponseWriter, r *http.Request) {
	templateID := chi.URLParam(r, "templateID")
	if templateID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Template ID is required")
		return
	}

	template, err := h.scheduleService.GetScheduleTemplate(r.Context(), templateID)
	if err != nil {
		ErrorResponse(w, http.StatusNotFound, err.Error())
		return
	}

	if err := json.NewEncoder(w).Encode(template); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// @Summary Update schedule template
// @Description Update an existing schedule template
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param templateID path string true "Template ID"
// @Param template body dto.UpdateScheduleTemplateRequest true "Template update data"
// @Success 200 {object} dto.ScheduleTemplateResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 404 {object} dto.ErrorResponse "Template not found"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/templates/{templateID} [put]
func (h *ScheduleHandler) UpdateScheduleTemplate(w http.ResponseWriter, r *http.Request) {
	templateID := chi.URLParam(r, "templateID")
	if templateID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Template ID is required")
		return
	}

	var req dto.UpdateScheduleTemplateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	template, err := h.scheduleService.UpdateScheduleTemplate(r.Context(), templateID, req)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := json.NewEncoder(w).Encode(template); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// @Summary Delete schedule template
// @Description Delete a schedule template
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param templateID path string true "Template ID"
// @Success 204 "No Content"
// @Failure 404 {object} dto.ErrorResponse "Template not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/templates/{templateID} [delete]
func (h *ScheduleHandler) DeleteScheduleTemplate(w http.ResponseWriter, r *http.Request) {
	templateID := chi.URLParam(r, "templateID")
	if templateID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Template ID is required")
		return
	}

	if err := h.scheduleService.DeleteScheduleTemplate(r.Context(), templateID); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// @Summary Set default template
// @Description Set a template as default for a staff member
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param staffID path string true "Staff ID"
// @Param templateID path string true "Template ID"
// @Success 204 "No Content"
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 404 {object} dto.ErrorResponse "Template not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/staff/{staffID}/templates/{templateID}/set-default [post]
func (h *ScheduleHandler) SetDefaultTemplate(w http.ResponseWriter, r *http.Request) {
	staffID := chi.URLParam(r, "staffID")
	templateID := chi.URLParam(r, "templateID")

	if staffID == "" || templateID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Staff ID and Template ID are required")
		return
	}

	if err := h.scheduleService.SetDefaultTemplate(r.Context(), staffID, templateID); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// @Summary Get shift
// @Description Get a specific shift by ID
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param shiftID path string true "Shift ID"
// @Success 200 {object} dto.ShiftResponse
// @Failure 404 {object} dto.ErrorResponse "Shift not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/shifts/{shiftID} [get]
func (h *ScheduleHandler) GetShift(w http.ResponseWriter, r *http.Request) {
	shiftID := chi.URLParam(r, "shiftID")
	if shiftID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Shift ID is required")
		return
	}

	shift, err := h.scheduleService.GetShift(r.Context(), shiftID)
	if err != nil {
		ErrorResponse(w, http.StatusNotFound, err.Error())
		return
	}

	if err := json.NewEncoder(w).Encode(shift); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// @Summary Update shift
// @Description Update an existing work shift
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param shiftID path string true "Shift ID"
// @Param shift body dto.UpdateShiftRequest true "Shift update data"
// @Success 200 {object} dto.ShiftResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 404 {object} dto.ErrorResponse "Shift not found"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 409 {object} dto.ErrorResponse "Schedule conflict"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/shifts/{shiftID} [put]
func (h *ScheduleHandler) UpdateShift(w http.ResponseWriter, r *http.Request) {
	shiftID := chi.URLParam(r, "shiftID")
	if shiftID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Shift ID is required")
		return
	}

	var req dto.UpdateShiftRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	shift, err := h.scheduleService.UpdateShift(r.Context(), shiftID, req)
	if err != nil {
		if isConflictError(err) {
			ErrorResponse(w, http.StatusConflict, err.Error())
		} else {
			ErrorResponse(w, http.StatusInternalServerError, err.Error())
		}
		return
	}

	if err := json.NewEncoder(w).Encode(shift); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// @Summary Delete shift
// @Description Delete a work shift
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param shiftID path string true "Shift ID"
// @Success 204 "No Content"
// @Failure 404 {object} dto.ErrorResponse "Shift not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/shifts/{shiftID} [delete]
func (h *ScheduleHandler) DeleteShift(w http.ResponseWriter, r *http.Request) {
	shiftID := chi.URLParam(r, "shiftID")
	if shiftID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Shift ID is required")
		return
	}

	if err := h.scheduleService.DeleteShift(r.Context(), shiftID); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// @Summary Bulk create shifts
// @Description Create multiple shifts at once
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param shifts body dto.BulkCreateShiftsRequest true "Bulk shifts data"
// @Success 201 {array} dto.ShiftResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 409 {object} dto.ErrorResponse "Schedule conflict"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/shifts/bulk [post]
func (h *ScheduleHandler) BulkCreateShifts(w http.ResponseWriter, r *http.Request) {
	var req dto.BulkCreateShiftsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	shifts, err := h.scheduleService.BulkCreateShifts(r.Context(), req)
	if err != nil {
		if isConflictError(err) {
			ErrorResponse(w, http.StatusConflict, err.Error())
		} else {
			ErrorResponse(w, http.StatusInternalServerError, err.Error())
		}
		return
	}

	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(shifts); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// @Summary Bulk update shifts
// @Description Update multiple shifts at once
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param shifts body dto.BulkUpdateShiftsRequest true "Bulk shift updates"
// @Success 200 {array} dto.ShiftResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/shifts/bulk [put]
func (h *ScheduleHandler) BulkUpdateShifts(w http.ResponseWriter, r *http.Request) {
	var req dto.BulkUpdateShiftsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	shifts, err := h.scheduleService.BulkUpdateShifts(r.Context(), req)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := json.NewEncoder(w).Encode(shifts); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// @Summary Bulk delete shifts
// @Description Delete multiple shifts at once
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param shifts body dto.BulkDeleteShiftsRequest true "Bulk shift deletion"
// @Success 204 "No Content"
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/shifts/bulk [delete]
func (h *ScheduleHandler) BulkDeleteShifts(w http.ResponseWriter, r *http.Request) {
	var req dto.BulkDeleteShiftsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	if err := h.scheduleService.BulkDeleteShifts(r.Context(), req); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// =======================
// Schedule Views
// =======================

// @Summary Get weekly schedule view
// @Description Get weekly schedule view for all or selected staff
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param week_start_date query string true "Week start date (YYYY-MM-DD)"
// @Param location_id query string false "Location id to filter"
// @Param staff_ids query []string false "Staff IDs to filter"
// @Success 200 {object} dto.WeeklyScheduleViewResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/views/weekly [get]
func (h *ScheduleHandler) GetWeeklyScheduleView(w http.ResponseWriter, r *http.Request) {
	businessID := chi.URLParam(r, "businessID")
	locationID := r.URL.Query().Get("location_id")
	if businessID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Business ID is required")
		return
	}

	weekStartDateStr := r.URL.Query().Get("week_start_date")
	if weekStartDateStr == "" {
		ErrorResponse(w, http.StatusBadRequest, "week_start_date parameter is required")
		return
	}

	weekStartDate, err := time.Parse("2006-01-02", weekStartDateStr)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid week_start_date format, use YYYY-MM-DD")
		return
	}

	staffIDs := r.URL.Query()["staff_ids"]

	scheduleView, err := h.scheduleService.GetWeeklyScheduleView(r.Context(), businessID, locationID, weekStartDate, staffIDs)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := json.NewEncoder(w).Encode(scheduleView); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// @Summary Get monthly schedule view
// @Description Get monthly schedule view for all or selected staff
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param year query int true "Year"
// @Param month query int true "Month (1-12)"
// @Param location_id query string false "Location id to filter"
// @Param staff_ids query []string false "Staff IDs to filter"
// @Success 200 {object} dto.WeeklyScheduleViewResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/views/monthly [get]
func (h *ScheduleHandler) GetMonthlyScheduleView(w http.ResponseWriter, r *http.Request) {
	businessID := chi.URLParam(r, "businessID")
	if businessID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Business ID is required")
		return
	}

	yearStr := r.URL.Query().Get("year")
	monthStr := r.URL.Query().Get("month")

	if yearStr == "" || monthStr == "" {
		ErrorResponse(w, http.StatusBadRequest, "year and month parameters are required")
		return
	}

	year, err := time.Parse("2006", yearStr)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid year format")
		return
	}

	month, err := time.Parse("1", monthStr)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid month format")
		return
	}

	staffIDs := r.URL.Query()["staff_ids"]

	scheduleView, err := h.scheduleService.GetMonthlyScheduleView(r.Context(), businessID, year, month, staffIDs)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := json.NewEncoder(w).Encode(scheduleView); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// @Summary Get staff weekly schedule
// @Description Get weekly schedule for a specific staff member
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param staffID path string true "Staff ID"
// @Param week_start_date query string true "Week start date (YYYY-MM-DD)"
// @Success 200 {object} dto.StaffWeeklyScheduleResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 404 {object} dto.ErrorResponse "Staff not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/views/staff/{staffID}/weekly [get]
func (h *ScheduleHandler) GetStaffWeeklySchedule(w http.ResponseWriter, r *http.Request) {
	staffID := chi.URLParam(r, "staffID")
	if staffID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Staff ID is required")
		return
	}

	weekStartDateStr := r.URL.Query().Get("week_start_date")
	if weekStartDateStr == "" {
		ErrorResponse(w, http.StatusBadRequest, "week_start_date parameter is required")
		return
	}

	weekStartDate, err := time.Parse("2006-01-02", weekStartDateStr)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid week_start_date format, use YYYY-MM-DD")
		return
	}

	schedule, err := h.scheduleService.GetStaffWeeklySchedule(r.Context(), staffID, weekStartDate)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := json.NewEncoder(w).Encode(schedule); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// @Summary Get staff day schedule
// @Description Get schedule for a specific staff member on a specific day
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param staffID path string true "Staff ID"
// @Param date query string true "Date (YYYY-MM-DD)"
// @Success 200 {object} dto.DayScheduleResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 404 {object} dto.ErrorResponse "Staff not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/views/staff/{staffID}/day [get]
func (h *ScheduleHandler) GetStaffDaySchedule(w http.ResponseWriter, r *http.Request) {
	staffID := chi.URLParam(r, "staffID")
	if staffID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Staff ID is required")
		return
	}

	dateStr := r.URL.Query().Get("date")
	if dateStr == "" {
		ErrorResponse(w, http.StatusBadRequest, "date parameter is required")
		return
	}

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid date format, use YYYY-MM-DD")
		return
	}

	schedule, err := h.scheduleService.GetStaffDaySchedule(r.Context(), staffID, date)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := json.NewEncoder(w).Encode(schedule); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// =======================
// Time Off Management
// =======================

// @Summary Get time off request
// @Description Get a specific time off request by ID
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param requestID path string true "Request ID"
// @Success 200 {object} dto.TimeOffResponse
// @Failure 404 {object} dto.ErrorResponse "Request not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/time-off/{requestID} [get]
func (h *ScheduleHandler) GetTimeOffRequest(w http.ResponseWriter, r *http.Request) {
	requestID := chi.URLParam(r, "requestID")
	if requestID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Request ID is required")
		return
	}

	timeOff, err := h.scheduleService.GetTimeOffRequest(r.Context(), requestID)
	if err != nil {
		ErrorResponse(w, http.StatusNotFound, err.Error())
		return
	}

	if err := json.NewEncoder(w).Encode(timeOff); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// @Summary Update time off request
// @Description Update a time off request (status, approval, etc.)
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param requestID path string true "Request ID"
// @Param request body dto.UpdateTimeOffRequest true "Time off update data"
// @Success 200 {object} dto.TimeOffResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 404 {object} dto.ErrorResponse "Request not found"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/time-off/{requestID} [put]
func (h *ScheduleHandler) UpdateTimeOffRequest(w http.ResponseWriter, r *http.Request) {
	requestID := chi.URLParam(r, "requestID")
	if requestID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Request ID is required")
		return
	}

	var req dto.UpdateTimeOffRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	timeOff, err := h.scheduleService.UpdateTimeOffRequest(r.Context(), requestID, req)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := json.NewEncoder(w).Encode(timeOff); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// @Summary Delete time off request
// @Description Delete a time off request
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param requestID path string true "Request ID"
// @Success 204 "No Content"
// @Failure 404 {object} dto.ErrorResponse "Request not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/time-off/{requestID} [delete]
func (h *ScheduleHandler) DeleteTimeOffRequest(w http.ResponseWriter, r *http.Request) {
	requestID := chi.URLParam(r, "requestID")
	if requestID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Request ID is required")
		return
	}

	if err := h.scheduleService.DeleteTimeOffRequest(r.Context(), requestID); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// @Summary Get staff time off requests
// @Description Get all time off requests for a specific staff member
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param staffID path string true "Staff ID"
// @Param start_date query string false "Start date filter (YYYY-MM-DD)"
// @Param end_date query string false "End date filter (YYYY-MM-DD)"
// @Success 200 {array} dto.TimeOffResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 404 {object} dto.ErrorResponse "Staff not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/time-off/staff/{staffID} [get]
func (h *ScheduleHandler) GetStaffTimeOffRequests(w http.ResponseWriter, r *http.Request) {
	staffID := chi.URLParam(r, "staffID")
	if staffID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Staff ID is required")
		return
	}

	startDateStr := r.URL.Query().Get("start_date")
	endDateStr := r.URL.Query().Get("end_date")

	var startDate, endDate *time.Time
	if startDateStr != "" {
		if parsed, err := time.Parse("2006-01-02", startDateStr); err == nil {
			startDate = &parsed
		} else {
			ErrorResponse(w, http.StatusBadRequest, "Invalid start_date format, use YYYY-MM-DD")
			return
		}
	}

	if endDateStr != "" {
		if parsed, err := time.Parse("2006-01-02", endDateStr); err == nil {
			endDate = &parsed
		} else {
			ErrorResponse(w, http.StatusBadRequest, "Invalid end_date format, use YYYY-MM-DD")
			return
		}
	}

	timeOffRequests, err := h.scheduleService.GetStaffTimeOffRequests(r.Context(), staffID, startDate, endDate)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := json.NewEncoder(w).Encode(timeOffRequests); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// @Summary Get business time off requests
// @Description Get all time off requests for the business
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param status query string false "Status filter (pending, approved, rejected, cancelled)"
// @Param start_date query string false "Start date filter (YYYY-MM-DD)"
// @Param end_date query string false "End date filter (YYYY-MM-DD)"
// @Success 200 {array} dto.TimeOffResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/time-off/business [get]
func (h *ScheduleHandler) GetBusinessTimeOffRequests(w http.ResponseWriter, r *http.Request) {
	businessID := chi.URLParam(r, "businessID")
	if businessID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Business ID is required")
		return
	}

	status := r.URL.Query().Get("status")
	startDateStr := r.URL.Query().Get("start_date")
	endDateStr := r.URL.Query().Get("end_date")

	var startDate, endDate *time.Time
	if startDateStr != "" {
		if parsed, err := time.Parse("2006-01-02", startDateStr); err == nil {
			startDate = &parsed
		} else {
			ErrorResponse(w, http.StatusBadRequest, "Invalid start_date format, use YYYY-MM-DD")
			return
		}
	}

	if endDateStr != "" {
		if parsed, err := time.Parse("2006-01-02", endDateStr); err == nil {
			endDate = &parsed
		} else {
			ErrorResponse(w, http.StatusBadRequest, "Invalid end_date format, use YYYY-MM-DD")
			return
		}
	}

	timeOffRequests, err := h.scheduleService.GetBusinessTimeOffRequests(r.Context(), businessID, status, startDate, endDate)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := json.NewEncoder(w).Encode(timeOffRequests); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// @Summary Get available staff
// @Description Get list of available staff for a specific time slot
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param date query string true "Date (YYYY-MM-DD)"
// @Param start_time query string true "Start time (HH:MM)"
// @Param end_time query string true "End time (HH:MM)"
// @Param exclude_staff_ids query []string false "Staff IDs to exclude"
// @Success 200 {array} dto.StaffAvailabilityResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/availability/available-staff [get]
func (h *ScheduleHandler) GetAvailableStaff(w http.ResponseWriter, r *http.Request) {
	businessID := chi.URLParam(r, "businessID")
	if businessID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Business ID is required")
		return
	}

	dateStr := r.URL.Query().Get("date")
	startTime := r.URL.Query().Get("start_time")
	endTime := r.URL.Query().Get("end_time")

	if dateStr == "" || startTime == "" || endTime == "" {
		ErrorResponse(w, http.StatusBadRequest, "date, start_time, and end_time parameters are required")
		return
	}

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid date format, use YYYY-MM-DD")
		return
	}

	excludeStaffIDs := r.URL.Query()["exclude_staff_ids"]

	availableStaff, err := h.scheduleService.GetAvailableStaff(r.Context(), businessID, date, startTime, endTime, excludeStaffIDs)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := json.NewEncoder(w).Encode(availableStaff); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// @Summary Get availability logs
// @Description Get availability change logs for a staff member
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param staffID path string true "Staff ID"
// @Param start_date query string false "Start date filter (YYYY-MM-DD)"
// @Param end_date query string false "End date filter (YYYY-MM-DD)"
// @Param limit query int false "Limit number of results (default: 50)"
// @Success 200 {array} dto.AvailabilityLogResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 404 {object} dto.ErrorResponse "Staff not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/availability/logs/{staffID} [get]
func (h *ScheduleHandler) GetAvailabilityLogs(w http.ResponseWriter, r *http.Request) {
	staffID := chi.URLParam(r, "staffID")
	if staffID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Staff ID is required")
		return
	}

	startDateStr := r.URL.Query().Get("start_date")
	endDateStr := r.URL.Query().Get("end_date")
	limitStr := r.URL.Query().Get("limit")

	var startDate, endDate *time.Time
	var limit int = 50 // default limit

	if startDateStr != "" {
		if parsed, err := time.Parse("2006-01-02", startDateStr); err == nil {
			startDate = &parsed
		} else {
			ErrorResponse(w, http.StatusBadRequest, "Invalid start_date format, use YYYY-MM-DD")
			return
		}
	}

	if endDateStr != "" {
		if parsed, err := time.Parse("2006-01-02", endDateStr); err == nil {
			endDate = &parsed
		} else {
			ErrorResponse(w, http.StatusBadRequest, "Invalid end_date format, use YYYY-MM-DD")
			return
		}
	}

	if limitStr != "" {
		if parsed, err := time.Parse("1", limitStr); err == nil {
			limit = int(parsed.Day())
		}
	}

	logs, err := h.scheduleService.GetAvailabilityLogs(r.Context(), staffID, startDate, endDate, limit)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := json.NewEncoder(w).Encode(logs); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// @Summary Quick enable staff
// @Description Quickly enable all shifts for a staff member on a specific date
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param staffID path string true "Staff ID"
// @Param action body dto.QuickStaffActionRequest true "Quick action data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/quick-actions/staff/{staffID}/enable [post]
func (h *ScheduleHandler) QuickEnableStaff(w http.ResponseWriter, r *http.Request) {
	staffID := chi.URLParam(r, "staffID")
	if staffID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Staff ID is required")
		return
	}

	var req dto.QuickStaffActionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	affectedShifts, err := h.scheduleService.QuickEnableStaff(r.Context(), staffID, req)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := map[string]interface{}{
		"message":         "Staff shifts enabled successfully",
		"affected_shifts": affectedShifts,
		"staff_id":        staffID,
		"date":            req.Date,
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// @Summary Quick disable staff
// @Description Quickly disable all shifts for a staff member on a specific date
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param staffID path string true "Staff ID"
// @Param action body dto.QuickStaffActionRequest true "Quick action data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/quick-actions/staff/{staffID}/disable [post]
func (h *ScheduleHandler) QuickDisableStaff(w http.ResponseWriter, r *http.Request) {
	staffID := chi.URLParam(r, "staffID")
	if staffID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Staff ID is required")
		return
	}

	var req dto.QuickStaffActionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	affectedShifts, err := h.scheduleService.QuickDisableStaff(r.Context(), staffID, req)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := map[string]interface{}{
		"message":         "Staff shifts disabled successfully",
		"affected_shifts": affectedShifts,
		"staff_id":        staffID,
		"date":            req.Date,
		"reason":          req.Reason,
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// @Summary Copy schedule
// @Description Copy schedule from one period to another
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param copy body dto.CopyScheduleRequest true "Schedule copy data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/quick-actions/copy-schedule [post]
func (h *ScheduleHandler) CopySchedule(w http.ResponseWriter, r *http.Request) {
	businessID := chi.URLParam(r, "businessID")
	if businessID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Business ID is required")
		return
	}

	var req dto.CopyScheduleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	copiedShifts, err := h.scheduleService.CopySchedule(r.Context(), businessID, req)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := map[string]interface{}{
		"message":       "Schedule copied successfully",
		"copied_shifts": copiedShifts,
		"source_start":  req.SourceStartDate,
		"source_end":    req.SourceEndDate,
		"target_start":  req.TargetStartDate,
		"staff_ids":     req.StaffIDs,
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// @Summary Get staff schedule statistics
// @Description Get detailed schedule statistics for a specific staff member
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param staffID path string true "Staff ID"
// @Param start_date query string true "Start date (YYYY-MM-DD)"
// @Param end_date query string true "End date (YYYY-MM-DD)"
// @Success 200 {object} dto.StaffScheduleStatsResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 404 {object} dto.ErrorResponse "Staff not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/stats/staff/{staffID} [get]
func (h *ScheduleHandler) GetStaffScheduleStats(w http.ResponseWriter, r *http.Request) {
	staffID := chi.URLParam(r, "staffID")
	if staffID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Staff ID is required")
		return
	}

	startDateStr := r.URL.Query().Get("start_date")
	endDateStr := r.URL.Query().Get("end_date")

	if startDateStr == "" || endDateStr == "" {
		ErrorResponse(w, http.StatusBadRequest, "start_date and end_date parameters are required")
		return
	}

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid start_date format, use YYYY-MM-DD")
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid end_date format, use YYYY-MM-DD")
		return
	}

	stats, err := h.scheduleService.GetStaffScheduleStats(r.Context(), staffID, startDate, endDate)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := json.NewEncoder(w).Encode(stats); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// @Summary Get business schedule statistics
// @Description Get detailed schedule statistics for the entire business
// @Tags Schedule
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param start_date query string true "Start date (YYYY-MM-DD)"
// @Param end_date query string true "End date (YYYY-MM-DD)"
// @Param include_staff_breakdown query bool false "Include per-staff breakdown"
// @Success 200 {object} dto.BusinessScheduleStatsResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/schedule/stats/business [get]
func (h *ScheduleHandler) GetBusinessScheduleStats(w http.ResponseWriter, r *http.Request) {
	businessID := chi.URLParam(r, "businessID")
	if businessID == "" {
		ErrorResponse(w, http.StatusBadRequest, "Business ID is required")
		return
	}

	startDateStr := r.URL.Query().Get("start_date")
	endDateStr := r.URL.Query().Get("end_date")
	includeStaffBreakdown := r.URL.Query().Get("include_staff_breakdown") == "true"

	if startDateStr == "" || endDateStr == "" {
		ErrorResponse(w, http.StatusBadRequest, "start_date and end_date parameters are required")
		return
	}

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid start_date format, use YYYY-MM-DD")
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid end_date format, use YYYY-MM-DD")
		return
	}

	stats, err := h.scheduleService.GetBusinessScheduleStats(r.Context(), businessID, startDate, endDate, includeStaffBreakdown)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := json.NewEncoder(w).Encode(stats); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// =======================
// Helper Functions
// =======================

func isConflictError(err error) bool {
	// Simple check for conflict errors - in production, you'd use typed errors
	return err != nil && (containsString(err.Error(), "conflict") ||
		containsString(err.Error(), "overlap") ||
		containsString(err.Error(), "already exists"))
}

func containsString(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr ||
		(len(s) > len(substr) && (s[:len(substr)] == substr || s[len(s)-len(substr):] == substr ||
			indexOf(s, substr) >= 0)))
}

func indexOf(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}
