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

type BookingHandler struct {
	bookingService *usecase.BookingService
}

func NewBookingHandler(bookingService *usecase.BookingService) *BookingHandler {
	return &BookingHandler{
		bookingService: bookingService,
	}
}

func (h *BookingHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Post("/", h.CreateBooking)
	r.Get("/availability", h.GetAvailability)
	return r
}

// @Summary Create a new booking
// @Description Creates a new booking for a service
// @Tags Booking
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param booking body dto.CreateBookingRequest true "Booking object"
// @Success 201
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 401 {object} dto.ErrorResponse "Unauthorized"
// @Failure 403 {object} dto.ErrorResponse "Forbidden"
// @Failure 404 {object} dto.ErrorResponse "Service or staff not found"
// @Failure 409 {object} dto.ErrorResponse "Time slot conflict"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/bookings [post]
func (h *BookingHandler) CreateBooking(w http.ResponseWriter, r *http.Request) {
	businessID := chi.URLParam(r, "businessID")
	if businessID == "" {
		ErrorResponse(w, http.StatusBadRequest, "business ID is required")
		return
	}

	var req dto.CreateBookingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	if errs := validate.Struct(req); errs != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnprocessableEntity)
		json.NewEncoder(w).Encode(map[string]any{"errors": errs})
		return
	}

	err := h.bookingService.CreateBooking(r.Context(), businessID, &req)
	if err != nil {
	
		switch {
		case err.Error() == "service not found" || err.Error() == "staff not found":
			ErrorResponse(w, http.StatusNotFound, err.Error())
		case err.Error() == "service does not belong to this business" || err.Error() == "staff does not belong to this business":
			ErrorResponse(w, http.StatusForbidden, err.Error())
		case err.Error() == "time slot is not available":
			ErrorResponse(w, http.StatusConflict, err.Error())
		default:
			ErrorResponse(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	w.WriteHeader(http.StatusCreated)
}

// @Summary Get available time slots
// @Description Get available time slots for a specific business and day
// @Tags Booking
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param day query string true "Date in YYYY-MM-DD format"
// @Param staff_id query string false "Staff ID to filter availability"
// @Success 200 {array} dto.SlotResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 401 {object} dto.ErrorResponse "Unauthorized"
// @Failure 404 {object} dto.ErrorResponse "Business not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/bookings/availability [get]
func (h *BookingHandler) GetAvailability(w http.ResponseWriter, r *http.Request) {
	businessID := chi.URLParam(r, "businessID")
	if businessID == "" {
		ErrorResponse(w, http.StatusBadRequest, "business ID is required")
		return
	}

	dayParam := r.URL.Query().Get("day")
	if dayParam == "" {
		ErrorResponse(w, http.StatusBadRequest, "day parameter is required")
		return
	}

	day, err := time.Parse("2006-01-02", dayParam)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid date format, use YYYY-MM-DD")
		return
	}

	staffIDParam := r.URL.Query().Get("staff_id")
	var staffID *string
	if staffIDParam != "" {
		staffID = &staffIDParam
	}

	slots, err := h.bookingService.GetAvailableSlots(r.Context(), businessID, staffID, day)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "internal server error")
		return
	}

	json.NewEncoder(w).Encode(slots)
}
