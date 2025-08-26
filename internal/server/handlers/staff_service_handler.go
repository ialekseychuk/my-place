package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/ialekseychuk/my-place/internal/dto"
	"github.com/ialekseychuk/my-place/internal/usecase"
	"github.com/ialekseychuk/my-place/pkg/validate"
)

type StaffServiceHandler struct {
	staffService *usecase.StaffService
}

func NewStaffServiceHandler(staffService *usecase.StaffService) *StaffServiceHandler {
	return &StaffServiceHandler{
		staffService: staffService,
	}
}

func (h *StaffServiceHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Post("/{staffID}/services", h.assignServiceToStaff)
	r.Delete("/{staffID}/services/{serviceID}", h.unassignServiceFromStaff)
	r.Get("/{staffID}/services", h.getStaffServices)
	r.Put("/{staffID}/services", h.replaceStaffServices)
	return r
}

// @Summary Assign service to staff
// @Description Assigns a service to a staff member
// @Tags StaffServices
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param staffID path string true "Staff ID"
// @Param request body dto.AssignServiceToStaffRequest true "Service assignment request"
// @Success 201 {object} dto.StaffServiceResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 401 {object} dto.ErrorResponse "Unauthorized"
// @Failure 404 {object} dto.ErrorResponse "Staff or service not found"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/staff-services/{staffID}/services [post]
func (h *StaffServiceHandler) assignServiceToStaff(w http.ResponseWriter, r *http.Request) {
	staffID := chi.URLParam(r, "staffID")
	businessID := chi.URLParam(r, "businessID")

	var req dto.AssignServiceToStaffRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	err := h.staffService.AssignServiceToStaff(r.Context(), staffID, req.ServiceID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Get the assignment details for response
	assignments, err := h.staffService.GetStaffServicesByBusiness(r.Context(), businessID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "Failed to get assignment details")
		return
	}

	// Find the created assignment
	for _, assignment := range assignments {
		if assignment.StaffID == staffID && assignment.ServiceID == req.ServiceID {
			response := dto.StaffServiceResponse{
				ID:          assignment.ID,
				StaffID:     assignment.StaffID,
				ServiceID:   assignment.ServiceID,
				StaffName:   assignment.StaffName,
				ServiceName: assignment.ServiceName,
				CreatedAt:   assignment.CreatedAt.Format(time.RFC3339),
				UpdatedAt:   assignment.UpdatedAt.Format(time.RFC3339),
			}
			w.WriteHeader(http.StatusCreated)
			json.NewEncoder(w).Encode(response)
			return
		}
	}

	w.WriteHeader(http.StatusCreated)
}

// @Summary Unassign service from staff
// @Description Removes a service assignment from a staff member
// @Tags StaffServices
// @Param businessID path string true "Business ID"
// @Param staffID path string true "Staff ID"
// @Param serviceID path string true "Service ID"
// @Success 204 "No content"
// @Failure 401 {object} dto.ErrorResponse "Unauthorized"
// @Failure 404 {object} dto.ErrorResponse "Assignment not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/staff-services/{staffID}/services/{serviceID} [delete]
func (h *StaffServiceHandler) unassignServiceFromStaff(w http.ResponseWriter, r *http.Request) {
	staffID := chi.URLParam(r, "staffID")
	serviceID := chi.URLParam(r, "serviceID")

	err := h.staffService.UnassignServiceFromStaff(r.Context(), staffID, serviceID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// @Summary Get staff services
// @Description Gets all services assigned to a staff member
// @Tags StaffServices
// @Produce json
// @Param businessID path string true "Business ID"
// @Param staffID path string true "Staff ID"
// @Success 200 {array} dto.ServiceResponse
// @Failure 401 {object} dto.ErrorResponse "Unauthorized"
// @Failure 404 {object} dto.ErrorResponse "Staff not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/staff-services/{staffID}/services [get]
func (h *StaffServiceHandler) getStaffServices(w http.ResponseWriter, r *http.Request) {
	staffID := chi.URLParam(r, "staffID")

	services, err := h.staffService.GetStaffServices(r.Context(), staffID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	var responses []dto.ServiceResponse
	for _, service := range services {
		responses = append(responses, dto.ServiceResponse{
			ID:          service.ID,
			BusinessID:  service.BusinessID,
			Name:        service.Name,
			DurationMin: service.DurationMin,
			PriceCents:  service.PriceCents,
			CreatedAt:   service.CreatedAt,
			UpdatedAt:   service.UpdatedAt,
		})
	}

	json.NewEncoder(w).Encode(responses)
}

// @Summary Replace staff services
// @Description Replaces all services assigned to a staff member with new ones
// @Tags StaffServices
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param staffID path string true "Staff ID"
// @Param request body dto.AssignMultipleServicesToStaffRequest true "Services assignment request"
// @Success 200 {array} dto.ServiceResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 401 {object} dto.ErrorResponse "Unauthorized"
// @Failure 404 {object} dto.ErrorResponse "Staff not found"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/staff-services/{staffID}/services [put]
func (h *StaffServiceHandler) replaceStaffServices(w http.ResponseWriter, r *http.Request) {
	staffID := chi.URLParam(r, "staffID")

	var req dto.AssignMultipleServicesToStaffRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	err := h.staffService.ReplaceStaffServices(r.Context(), staffID, req.ServiceIDs)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Return the updated services list
	services, err := h.staffService.GetStaffServices(r.Context(), staffID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "Failed to get updated services")
		return
	}

	var responses []dto.ServiceResponse
	for _, service := range services {
		responses = append(responses, dto.ServiceResponse{
			ID:          service.ID,
			BusinessID:  service.BusinessID,
			Name:        service.Name,
			DurationMin: service.DurationMin,
			PriceCents:  service.PriceCents,
			CreatedAt:   service.CreatedAt,
			UpdatedAt:   service.UpdatedAt,
		})
	}

	json.NewEncoder(w).Encode(responses)
}
