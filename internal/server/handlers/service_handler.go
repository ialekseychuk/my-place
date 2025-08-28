package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/ialekseychuk/my-place/internal/domain"
	"github.com/ialekseychuk/my-place/internal/dto"
	"github.com/ialekseychuk/my-place/internal/usecase"
	"github.com/ialekseychuk/my-place/pkg/validate"
)

type ServiceHandler struct {
	uc *usecase.ServiceService
}

func NewServiceHandler(uc *usecase.ServiceService) *ServiceHandler {
	return &ServiceHandler{
		uc: uc,
	}
}

func (h *ServiceHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Post("/", h.createService)
	r.Get("/", h.getServicesByBusiness)
	r.Get("/{serviceID}", h.getService)
	r.Put("/{serviceID}", h.updateService)
	r.Delete("/{serviceID}", h.deleteService)
	return r
}

// @Summary Create a new service
// @Description Creates a new service for business
// @Tags Service
// @Accept json
// @Produce json
// @Param service body dto.CreateServiceRequest true "Service object"
// @Param businessID path string true "Business ID"
// @Success 201 {object} dto.ServiceResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 401 {object} dto.ErrorResponse "Unauthorized"
// @Failure 403 {object} dto.ErrorResponse "Forbidden"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/services [post]
func (h *ServiceHandler) createService(w http.ResponseWriter, r *http.Request) {
	businessID := chi.URLParam(r, "businessID")

	var req dto.CreateServiceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}
	svc := &domain.Service{
		BusinessID:  businessID,
		LocationID:  req.LocationID,
		Name:        req.Name,
		DurationMin: req.DurationMin,
		PriceCents:  req.PriceCents,
	}

	if err := h.uc.CreateService(r.Context(), svc); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "internal server error")
		return
	}

	// Convert to DTO response
	response := h.convertToServiceResponse(svc)
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// @Summary Get services by business
// @Description Get all services for a business
// @Tags Service
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Success 200 {array} dto.ServiceResponse
// @Failure 404 {object} dto.ErrorResponse "Not found"
// @Failure 401 {object} dto.ErrorResponse "Unauthorized"
// @Failure 403 {object} dto.ErrorResponse "Forbidden"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/services [get]
func (h *ServiceHandler) getServicesByBusiness(w http.ResponseWriter, r *http.Request) {
	businessID := chi.URLParam(r, "businessID")
	services, err := h.uc.ListByBusinessId(r.Context(), businessID)
	if err != nil {
		ErrorResponse(w, http.StatusNotFound, "Not found")
		return
	}

	// Convert to DTO responses
	var responses []dto.ServiceResponse
	for _, service := range services {
		responses = append(responses, h.convertToServiceResponse(&service))
	}

	json.NewEncoder(w).Encode(responses)
}

// @Summary Get service by ID
// @Description Get a specific service by ID
// @Tags Service
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param serviceID path string true "Service ID"
// @Success 200 {object} dto.ServiceResponse
// @Failure 404 {object} dto.ErrorResponse "Service not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/services/{serviceID} [get]
func (h *ServiceHandler) getService(w http.ResponseWriter, r *http.Request) {
	serviceID := chi.URLParam(r, "serviceID")
	service, err := h.uc.GetServiceById(r.Context(), serviceID)
	if err != nil {
		ErrorResponse(w, http.StatusNotFound, "Service not found")
		return
	}

	response := h.convertToServiceResponse(service)
	json.NewEncoder(w).Encode(response)
}

// @Summary Update service
// @Description Update service information
// @Tags Service
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param serviceID path string true "Service ID"
// @Param service body dto.UpdateServiceRequest true "Service update data"
// @Success 200 {object} dto.ServiceResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 404 {object} dto.ErrorResponse "Service not found"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/services/{serviceID} [put]
func (h *ServiceHandler) updateService(w http.ResponseWriter, r *http.Request) {
	serviceID := chi.URLParam(r, "serviceID")

	// Get existing service
	service, err := h.uc.GetServiceById(r.Context(), serviceID)
	if err != nil {
		ErrorResponse(w, http.StatusNotFound, "Service not found")
		return
	}

	var req dto.UpdateServiceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	// Update only provided fields
	if req.Name != "" {
		service.Name = req.Name
	}
	if req.DurationMin > 0 {
		service.DurationMin = req.DurationMin
	}
	if req.PriceCents > 0 {
		service.PriceCents = req.PriceCents
	}
	if req.LocationID != "" {
		service.LocationID = req.LocationID
	}
	

	if err := h.uc.UpdateService(r.Context(), service); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	response := h.convertToServiceResponse(service)
	json.NewEncoder(w).Encode(response)
}

// @Summary Delete service
// @Description Delete a service by ID
// @Tags Service
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param serviceID path string true "Service ID"
// @Success 204
// @Failure 404 {object} dto.ErrorResponse "Service not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/services/{serviceID} [delete]
func (h *ServiceHandler) deleteService(w http.ResponseWriter, r *http.Request) {
	serviceID := chi.URLParam(r, "serviceID")

	if err := h.uc.DeleteService(r.Context(), serviceID); err != nil {
		ErrorResponse(w, http.StatusNotFound, "Service not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Helper method to convert domain.Service to dto.ServiceResponse
func (h *ServiceHandler) convertToServiceResponse(service *domain.Service) dto.ServiceResponse {
	return dto.ServiceResponse{
		ID:          service.ID,
		BusinessID:  service.BusinessID,
		LocationID:  service.LocationID,
		Name:        service.Name,
		DurationMin: service.DurationMin,
		PriceCents:  service.PriceCents,
		CreatedAt:   service.CreatedAt,
		UpdatedAt:   service.UpdatedAt,
	}
}
