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
	return r
}

func (h *ServiceHandler) createService(w http.ResponseWriter, r *http.Request) {
	businessID := chi.URLParam(r, "businessID")

	var req dto.CreateServiceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if errs := validate.Struct(req); errs != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnprocessableEntity)
		json.NewEncoder(w).Encode(map[string]any{"errors": errs})
		return
	}
	svc := &domain.Service{
		BusinessID: businessID,
		Name: req.Name,
		DurationMin: req.DurationMin,
		PriceCents: req.PriceCents,
	}
	
	if err := h.uc.CreateService(r.Context(), svc); err!= nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(svc)
}

