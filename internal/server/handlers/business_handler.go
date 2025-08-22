package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/ialekseychuk/my-place/internal/dto"
	"github.com/ialekseychuk/my-place/internal/usecase"
	"github.com/ialekseychuk/my-place/pkg/validate"
)


type BusinessHandler struct {
	uc *usecase.BusinessUseCase
}

func NewBusinessHandler(uc *usecase.BusinessUseCase) *BusinessHandler {
	return &BusinessHandler{
		uc: uc,
	}
}

func (h *BusinessHandler) Routes() chi.Router {
	r:= chi.NewRouter()
	r.Post("/", h.createBusiness)
	r.Get("/{id}", h.getBusiness)
	return r
}


func (h *BusinessHandler) createBusiness(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateBusinessRequest
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
	b, err := h.uc.CreateBusiness(r.Context(), req.Name, req.Timezone)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(b)

}

func (h *BusinessHandler) getBusiness(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	b, err := h.uc.GetById(r.Context(), id)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(b)
}