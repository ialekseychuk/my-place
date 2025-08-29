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
	r.Post("/", h.CreateStaff)
	r.Get("/", h.GetStaffsByBusiness)
	r.Get("/{staffID}", h.GetStaff)
	r.Put("/{staffID}", h.UpdateStaff)
	return r
}

// @Summary Create a new staff
// @Description Creates a new staff for business
// @Tags Staff
// @Accept json
// @Produce json
// @Param staff body dto.CreateStaffRequest true "Staff object"
// @Param businessID path string true "Business ID"
// @Success 201 {object} dto.StaffResponse
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 401 {object} dto.ErrorResponse "Unauthorized"
// @Failure 403 {object} dto.ErrorResponse "Forbidden"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/staffs [post]
func (h *StaffHandler) CreateStaff(w http.ResponseWriter, r *http.Request) {

	businessId := chi.URLParam(r, "businessID")
	var req dto.CreateStaffRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "unprocessable entity")
		return
	}
	req.LocationID = "6c1934d6-5074-4ca8-8494-eb986be440c9"
	errs := validate.Struct(req)
	if errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	staff := &domain.Staff{
		BusinessID:     businessId,
		LocationID:     req.LocationID,
		FirstName:      req.FirstName,
		LastName:       req.LastName,
		Phone:          req.Phone,
		Gender:         req.Gender,
		Position:       req.Position,
		Description:    req.Description,
		Specialization: req.Specialization,
	}

	err := h.uc.CreateStaff(r.Context(), staff)

	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "internal server error")
		return
	}

	response := h.convertToStaffResponse(staff)
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
}

// @Summary get staffs
// @Description get staffs for company or location
// @Tags Staff
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param location_id query string false "Location ID"
// @Success 200 {array} dto.StaffResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 401 {object} dto.ErrorResponse "Unauthorized"
// @Failure 403 {object} dto.ErrorResponse "Forbidden"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/staffs [get]
func (h *StaffHandler) GetStaffsByBusiness(w http.ResponseWriter, r *http.Request) {
	businessId := chi.URLParam(r, "businessID")
	locationId := r.URL.Query().Get("location_id")

	
	staffs, err := h.uc.ListByBusinessId(r.Context(), businessId, locationId)
	if err != nil {
		ErrorResponse(w, http.StatusNotFound, "not found")
		return
	}

	var responses []dto.StaffResponse
	for _, staff := range staffs {
		responses = append(responses, h.convertToStaffResponse(&staff))
	}

	if err := json.NewEncoder(w).Encode(responses); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
}

func (h *StaffHandler) convertToStaffResponse(staff *domain.Staff) dto.StaffResponse {
	fullName := staff.FirstName
	if staff.LastName != "" {
		fullName += " " + staff.LastName
	}

	return dto.StaffResponse{
		ID:             staff.ID,
		BusinessID:     staff.BusinessID,
		LocationID:     staff.LocationID,
		FirstName:      staff.FirstName,
		LastName:       staff.LastName,
		FullName:       fullName,
		Phone:          staff.Phone,
		Gender:         staff.Gender,
		Position:       staff.Position,
		Description:    staff.Description,
		Specialization: staff.Specialization,
		IsActive:       staff.IsActive,
		CreatedAt:      staff.CreatedAt,
		UpdatedAt:      staff.UpdatedAt,
	}
}

// @Summary Get staff by ID
// @Description Get staff member by ID
// @Tags Staff
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param staffID path string true "Staff ID"
// @Success 200 {object} dto.StaffResponse
// @Failure 404 {object} dto.ErrorResponse "Staff not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/staffs/{staffID} [get]
func (h *StaffHandler) GetStaff(w http.ResponseWriter, r *http.Request) {
	staffID := chi.URLParam(r, "staffID")
	//businessID := chi.URLParam(r, "businessID")
	
	staff, err := h.uc.GetById(r.Context(), staffID)
	if err != nil {
		ErrorResponse(w, http.StatusNotFound, "staff not found")
		return
	}

	response := h.convertToStaffResponse(staff)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
}

// @Summary Update staff
// @Description Update staff member information
// @Tags Staff
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param staffID path string true "Staff ID"
// @Param staff body dto.UpdateStaffRequest true "Staff update data"
// @Success 200 {object} dto.StaffResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 404 {object} dto.ErrorResponse "Staff not found"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/staffs/{staffID} [put]
func (h *StaffHandler) UpdateStaff(w http.ResponseWriter, r *http.Request) {
	staffID := chi.URLParam(r, "staffID")

	staff, err := h.uc.GetById(r.Context(), staffID)
	if err != nil {
		ErrorResponse(w, http.StatusNotFound, "staff not found")
		return
	}

	var req dto.UpdateStaffRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	errs := validate.Struct(req)
	if errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	if req.FirstName != "" {
		staff.FirstName = req.FirstName
	}
	if req.LastName != "" {
		staff.LastName = req.LastName
	}
	if req.Phone != "" {
		staff.Phone = req.Phone
	}
	if req.Gender != "" {
		staff.Gender = req.Gender
	}
	if req.Position != "" {
		staff.Position = req.Position
	}
	if req.Description != "" {
		staff.Description = req.Description
	}
	if req.Specialization != "" {
		staff.Specialization = req.Specialization
	}
	if req.LocationID != "" {
		staff.LocationID = req.LocationID
	}
	if req.IsActive != nil {
		staff.IsActive = *req.IsActive
	}

	err = h.uc.UpdateStaff(r.Context(), staff)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "internal server error")
		return
	}

	response := h.convertToStaffResponse(staff)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
}
