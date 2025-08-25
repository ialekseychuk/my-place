package handlers

import (
	"encoding/json"
	"fmt"
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

	// Временный отладочный маршрут
    r.Post("/test", func(w http.ResponseWriter, r *http.Request) {
        businessID := chi.URLParam(r, "businessID")
        w.Write([]byte("Test POST in ServiceHandler for businessID: " + businessID))
    })
	return r
}

// @Summary Create a new service
// @Description Creates a new service for business
// @Tags Service
// @Accept json
// @Produce json
// @Param service body dto.CreateServiceRequest true "Service object"
// @Param businessID path string true "Business ID"
// @Success 201
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 401 {object} dto.ErrorResponse "Unauthorized"
// @Failure 403 {object} dto.ErrorResponse "Forbidden"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/services [post]
func (h *ServiceHandler) createService(w http.ResponseWriter, r *http.Request) {
	businessID := chi.URLParam(r, "businessID")
	fmt.Println("==============", businessID)
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
		Name:        req.Name,
		DurationMin: req.DurationMin,
		PriceCents:  req.PriceCents,
	}

	if err := h.uc.CreateService(r.Context(), svc); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "internal server error")
		return

	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(svc)
}

// @Summary get services
// @Description get services
// @Tags Service
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Success 200
// @Failure 404
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 401 {object} dto.ErrorResponse "Unauthorized"
// @Failure 403 {object} dto.ErrorResponse "Forbidden"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/services [get]
func (h *ServiceHandler) getServicesByBusiness(w http.ResponseWriter, r *http.Request) {
	businesID := chi.URLParam(r, "businessID")
	b, err := h.uc.ListByBusinessId(r.Context(), businesID)
	if err != nil {
		ErrorResponse(w, http.StatusNotFound, "Not found")
		return
	}
	
	json.NewEncoder(w).Encode(b)
}
