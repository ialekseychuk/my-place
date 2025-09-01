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
}

func NewWidgetHandler(
	locationService *usecase.LocationService,
	serviceService *usecase.ServiceService,
	staffService *usecase.StaffService,
	scheduleService *usecase.ScheduleService,
) *WidgetHandler {
	return &WidgetHandler{
		locationService: locationService,
		serviceService:  serviceService,
		staffService:    staffService,
		scheduleService: scheduleService,
	}
}

func (h *WidgetHandler) Routes() chi.Router {
	r := chi.NewRouter()

	r.Get("/locations/{businessID}", h.GetLocations)
	r.Get("/services/{businessID}", h.GetServices)
	r.Get("/staff/{businessID}", h.GetStaff)
	r.Get("/staff-services/{businessID}", h.GetStaffServices)
	r.Get("/availability/{businessID}", h.GetAvailableStaff)

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
			CreatedAt:   location.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:   location.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
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
