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
	r := chi.NewRouter()
	r.Post("/", h.CreateBusiness)
	r.Post("/register", h.RegisterBusiness)
	r.Get("/{id}", h.GetBusiness)
	return r
}

// @Summary Create a new Business
// @Description Creates a new company
// @Tags Business
// @Accept json
// @Produce json
// @Param company body dto.CreateBusinessRequest true "Business object"
// @Success 201
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 401 {object} dto.ErrorResponse "Unauthorized"
// @Failure 403 {object} dto.ErrorResponse "Forbidden"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses [post]
func (h *BusinessHandler) CreateBusiness(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateBusinessRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}
	b, err := h.uc.CreateBusiness(r.Context(), req.BusinessName, req.Timezone)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "internal server error")

		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(b)

}

// @Summary Register a new Business with owner and settings
// @Description Creates a new business with complete registration including owner and working hours
// @Tags Business
// @Accept json
// @Produce json
// @Param registration body dto.CreateBusinessRequest true "Business registration object"
// @Success 201 {object} dto.CreateBusinessResponse
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Router /api/v1/businesses/register [post]
func (h *BusinessHandler) RegisterBusiness(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateBusinessRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusBadRequest, errs)
		return
	}

	resp, err := h.uc.RegisterBusiness(r.Context(), req)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "Registration failed")
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resp)
}

// @Summary Get company by id
// @Description Get company by id
// @Tags Business
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
// @Router /api/v1/businesses/{businessID} [get]
func (h *BusinessHandler) GetBusiness(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "businessID")
	b, err := h.uc.GetById(r.Context(), id)
	if err != nil {
		ErrorResponse(w, http.StatusNotFound, "Not found")
		return
	}

	json.NewEncoder(w).Encode(b)
}
