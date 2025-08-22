package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/ialekseychuk/my-place/internal/usecase"
)

type AvailabilityHandler struct {
	uc *usecase.BookingService
}

func NewAvailabilityHandler(uc *usecase.BookingService) *AvailabilityHandler {
	return &AvailabilityHandler{
		uc: uc,
	}
}

func (h *AvailabilityHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.list)

	return r
}

func (h *AvailabilityHandler) list(w http.ResponseWriter, r *http.Request) {
	businessID := chi.URLParam(r, "businessID")
	staffID := r.URL.Query().Get("staff_id")
	dayStr := r.URL.Query().Get("day") // YYYY-MM-DD

	day, err := time.Parse("2006-01-02", dayStr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	slots, err := h.uc.Availability(r.Context(), businessID, staffID, day)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(slots)

}
