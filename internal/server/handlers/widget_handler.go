package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/ialekseychuk/my-place/internal/dto"
	"github.com/ialekseychuk/my-place/internal/usecase"
)

type WidgetHandler struct {
	locationService *usecase.LocationService
	serviceService  *usecase.ServiceService
	staffService    *usecase.StaffService
	scheduleService *usecase.ScheduleService
	bookingService  *usecase.BookingService
}

func NewWidgetHandler(
	locationService *usecase.LocationService,
	serviceService *usecase.ServiceService,
	staffService *usecase.StaffService,
	scheduleService *usecase.ScheduleService,
	bookingService *usecase.BookingService,
) *WidgetHandler {
	return &WidgetHandler{
		locationService: locationService,
		serviceService:  serviceService,
		staffService:    staffService,
		scheduleService: scheduleService,
		bookingService:  bookingService,
	}
}

func (h *WidgetHandler) Routes() chi.Router {
	r := chi.NewRouter()

	r.Get("/locations/{businessID}", h.GetLocations)
	r.Get("/services/{businessID}", h.GetServices)
	r.Get("/staff/{businessID}", h.GetStaff)
	r.Get("/staff-services/{businessID}", h.GetStaffServices)
	r.Get("/availability/{businessID}", h.GetAvailableStaff)
	r.Get("/bookings/{businessID}", h.GetStaffBookings)
	r.Get("/staff/{staffID}/day", h.GetStaffDaySchedule) // New public endpoint for widget

	return r
}

// @Summary Get all locations for a business (public endpoint for widget)
// @Description Get all locations for a business without authentication
// @Tags Widget
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Success 200 {object} dto.LocationListResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /api/v1/widget/locations/{businessID} [get]
func (h *WidgetHandler) GetLocations(w http.ResponseWriter, r *http.Request) {
	businessID := chi.URLParam(r, "businessID")
	if businessID == "" {
		ErrorResponse(w, http.StatusBadRequest, "businessID is required")
		return
	}

	locations, err := h.locationService.GetLocationsByBusinessID(r.Context(), businessID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := dto.LocationListResponse{
		Locations: make([]dto.LocationResponse, len(locations)),
	}

	for i, location := range locations {
		response.Locations[i] = dto.LocationResponse{
			ID:          location.ID,
			BusinessID:  location.BusinessID,
			Name:        location.Name,
			Address:     location.Address,
			City:        location.City,
			ContactInfo: location.ContactInfo,
			Timezone:    location.Timezone,
			CreatedAt:   location.CreatedAt,
			UpdatedAt:   location.UpdatedAt,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// @Summary Get all services for a business (public endpoint for widget)
// @Description Get all services for a business without authentication
// @Tags Widget
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param location_id query string false "Location ID to filter services"
// @Success 200 {array} dto.ServiceResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /api/v1/widget/services/{businessID} [get]
func (h *WidgetHandler) GetServices(w http.ResponseWriter, r *http.Request) {
	businessID := chi.URLParam(r, "businessID")
	if businessID == "" {
		ErrorResponse(w, http.StatusBadRequest, "businessID is required")
		return
	}

	// Get all services for the business
	services, err := h.serviceService.ListByBusinessId(r.Context(), businessID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Convert to response format
	response := make([]dto.ServiceResponse, len(services))
	for i, service := range services {
		response[i] = dto.ServiceResponse{
			ID:          service.ID,
			BusinessID:  service.BusinessID,
			Name:        service.Name,
			DurationMin: service.DurationMin,
			PriceCents:  service.PriceCents,
			CreatedAt:   service.CreatedAt,
			UpdatedAt:   service.UpdatedAt,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// @Summary Get all staff for a business (public endpoint for widget)
// @Description Get all staff for a business without authentication
// @Tags Widget
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param location_id query string false "Location ID to filter staff"
// @Success 200 {array} dto.StaffResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /api/v1/widget/staff/{businessID} [get]
func (h *WidgetHandler) GetStaff(w http.ResponseWriter, r *http.Request) {
	businessID := chi.URLParam(r, "businessID")
	if businessID == "" {
		ErrorResponse(w, http.StatusBadRequest, "businessID is required")
		return
	}

	locationID := r.URL.Query().Get("location_id")

	staff, err := h.staffService.ListByBusinessId(r.Context(), businessID, locationID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := make([]dto.StaffResponse, len(staff))
	for i, s := range staff {
		response[i] = dto.StaffResponse{
			ID:             s.ID,
			BusinessID:     s.BusinessID,
			LocationID:     s.LocationID,
			FirstName:      s.FirstName,
			LastName:       s.LastName,
			FullName:       s.FirstName + " " + s.LastName,
			Phone:          s.Phone,
			Gender:         s.Gender,
			Position:       s.Position,
			Description:    s.Description,
			Specialization: s.Specialization,
			IsActive:       s.IsActive,
			CreatedAt:      s.CreatedAt,
			UpdatedAt:      s.UpdatedAt,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// @Summary Get all staff-service assignments for a business (public endpoint for widget)
// @Description Get all staff-service assignments for a business without authentication
// @Tags Widget
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Success 200 {array} dto.StaffServiceResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /api/v1/widget/staff-services/{businessID} [get]
func (h *WidgetHandler) GetStaffServices(w http.ResponseWriter, r *http.Request) {
	businessID := chi.URLParam(r, "businessID")
	if businessID == "" {
		ErrorResponse(w, http.StatusBadRequest, "businessID is required")
		return
	}

	assignments, err := h.staffService.GetStaffServicesByBusiness(r.Context(), businessID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := make([]dto.StaffServiceResponse, len(assignments))
	for i, assignment := range assignments {
		response[i] = dto.StaffServiceResponse{
			ID:          assignment.ID,
			StaffID:     assignment.StaffID,
			ServiceID:   assignment.ServiceID,
			StaffName:   assignment.StaffName,
			ServiceName: assignment.ServiceName,
			CreatedAt:   assignment.CreatedAt.Format(time.RFC3339),
			UpdatedAt:   assignment.UpdatedAt.Format(time.RFC3339),
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// @Summary Get available staff for a business (public endpoint for widget)
// @Description Get available staff for a business without authentication
// @Tags Widget
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param date query string true "Date to check availability (YYYY-MM-DD)"
// @Param start_time query string false "Start time to check availability (HH:MM)"
// @Param end_time query string false "End time to check availability (HH:MM)"
// @Param location_id query string false "Location ID to filter staff"
// @Success 200 {array} dto.AvailableStaffResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /api/v1/widget/availability/{businessID} [get]
func (h *WidgetHandler) GetAvailableStaff(w http.ResponseWriter, r *http.Request) {
	businessID := chi.URLParam(r, "businessID")
	if businessID == "" {
		ErrorResponse(w, http.StatusBadRequest, "businessID is required")
		return
	}

	dateStr := r.URL.Query().Get("date")
	if dateStr == "" {
		ErrorResponse(w, http.StatusBadRequest, "date is required")
		return
	}

	// Parse the date
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid date format")
		return
	}

	startTime := r.URL.Query().Get("start_time")
	endTime := r.URL.Query().Get("end_time")
	locationID := r.URL.Query().Get("location_id")

	// Get available staff using the existing method
	availableStaff, err := h.scheduleService.GetAvailableStaff(r.Context(), businessID, locationID, date, startTime, endTime, nil)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := make([]dto.AvailableStaffResponse, len(availableStaff))
	for i, staff := range availableStaff {
		response[i] = dto.AvailableStaffResponse{
			StaffID:     staff.StaffID,
			StaffName:   staff.StaffName,
			IsAvailable: staff.IsAvailable,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// @Summary Get bookings for a staff member on a specific date (public endpoint for widget)
// @Description Get bookings for a staff member on a specific date without authentication
// @Tags Widget
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param staff_id query string true "Staff ID"
// @Param date query string true "Date (YYYY-MM-DD)"
// @Success 200 {array} dto.BookingResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /api/v1/widget/bookings/{businessID} [get]
func (h *WidgetHandler) GetStaffBookings(w http.ResponseWriter, r *http.Request) {
	businessID := chi.URLParam(r, "businessID")
	if businessID == "" {
		ErrorResponse(w, http.StatusBadRequest, "businessID is required")
		return
	}

	staffID := r.URL.Query().Get("staff_id")
	if staffID == "" {
		ErrorResponse(w, http.StatusBadRequest, "staff_id is required")
		return
	}

	dateStr := r.URL.Query().Get("date")
	if dateStr == "" {
		ErrorResponse(w, http.StatusBadRequest, "date is required")
		return
	}

	// Parse the date
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid date format")
		return
	}

	// Set start and end of day in UTC (as dates in DB are stored in UTC)
	// But we need to convert the date to UTC based on Moscow timezone
	moscowLoc, _ := time.LoadLocation("Europe/Moscow")
	// Create a date in Moscow timezone
	moscowDate := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, moscowLoc)

	// Convert to UTC for database query
	startOfDay := time.Date(moscowDate.Year(), moscowDate.Month(), moscowDate.Day(), 0, 0, 0, 0, time.UTC)
	endOfDay := time.Date(moscowDate.Year(), moscowDate.Month(), moscowDate.Day(), 23, 59, 59, 999999999, time.UTC)

	// Get bookings for the staff member on this date
	bookings, err := h.bookingService.GetBookingsByBusiness(r.Context(), businessID, &startOfDay, &endOfDay, nil)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Filter bookings for the specific staff member
	var staffBookings []*dto.BookingResponse
	for _, booking := range bookings {
		if booking.StaffID == staffID {
			staffBookings = append(staffBookings, booking)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(staffBookings)
}

// @Summary Get staff day schedule (public endpoint for widget)
// @Description Get staff day schedule without authentication
// @Tags Widget
// @Accept json
// @Produce json
// @Param staffID path string true "Staff ID"
// @Param date query string true "Date (YYYY-MM-DD)"
// @Success 200 {object} dto.DayScheduleResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /api/v1/widget/staff/{staffID}/day [get]
func (h *WidgetHandler) GetStaffDaySchedule(w http.ResponseWriter, r *http.Request) {
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

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(schedule)
}
