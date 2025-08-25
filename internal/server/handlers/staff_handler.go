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


type StaffHandler struct {
	uc *usecase.StaffService
}

func NewStaffHandler(uc *usecase.StaffService) *StaffHandler {
	return &StaffHandler{
		uc: uc,
	}
}

func (h *StaffHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Post("/", h.createStaff)
	r.Get("/", h.getStaffsByBusiness)
	return r
}

//@Summary Create a new staff
// @Description Creates a new staff for business
// @Tags Staff
// @Accept json
// @Produce json
// @Param staff body dto.CreateStaffRequest true "Staff object"
// @Param businessID path string true "Business ID"
// @Success 201
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 401 {object} dto.ErrorResponse "Unauthorized"
// @Failure 403 {object} dto.ErrorResponse "Forbidden"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/staffs [post]
func (h *StaffHandler) createStaff(w http.ResponseWriter, r *http.Request) {
	businessId := chi.URLParam(r, "businessID")
	var req dto.CreateStaffRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "unprocessable entity")
		return
	}

	errs := validate.Struct(req)
	if errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	staff := &domain.Staff{
		BusinessID: businessId,
		FullName:   req.FullName,
	}

	err := h.uc.CreateStaff(r.Context(), staff)

	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "internal server error")
		return
	}
	w.WriteHeader(http.StatusCreated)

}

//@Summary get staffs
// @Description get staffs
// @Tags Staff
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
// @Router /api/v1/businesses/{businessID}/staffs [get]
func (h *StaffHandler) getStaffsByBusiness(w http.ResponseWriter, r *http.Request) {
	businessId := chi.URLParam(r, "businessID")
	staffs, err := h.uc.ListByBusinessId(r.Context(), businessId)
	if err != nil {
		ErrorResponse(w, http.StatusNotFound, "not found")
		return
	}
	json.NewEncoder(w).Encode(staffs)
}