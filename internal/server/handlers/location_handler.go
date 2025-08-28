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

type LocationHandler struct {
	locationService *usecase.LocationService
}

func NewLocationHandler(locationService *usecase.LocationService) *LocationHandler {
	return &LocationHandler{
		locationService: locationService,
	}
}

func (h *LocationHandler) Routes() chi.Router {
	r := chi.NewRouter()

	r.Get("/", h.GetLocations)
	r.Post("/", h.CreateLocation)
	r.Get("/{locationID}", h.GetLocation)
	r.Put("/{locationID}", h.UpdateLocation)
	r.Delete("/{locationID}", h.DeleteLocation)

	return r
}

// @Summary Get all locations for a business
// @Description Get all locations for a business
// @Tags Locations
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Success 200 {object} dto.LocationListResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/locations [get]
func (h *LocationHandler) GetLocations(w http.ResponseWriter, r *http.Request) {
	businessID := chi.URLParam(r, "businessID")
	if businessID == "" {
		ErrorResponse(w, http.StatusBadRequest, "businessID is required")
		return
	}

	locations, err := h.locationService.GetLocationsByBusinessID(r.Context(), businessID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := dto.LocationListResponse{
		Locations: make([]dto.LocationResponse, len(locations)),
	}

	for i, location := range locations {
		response.Locations[i] = dto.LocationResponse{
			ID:          location.ID,
			BusinessID:  location.BusinessID,
			Name:        location.Name,
			Address:     location.Address,
			City:        location.City,
			ContactInfo: location.ContactInfo,
			Timezone:    location.Timezone,
			CreatedAt:   location.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:   location.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		}
	}

	json.NewEncoder(w).Encode(response)
}

// @Summary Create a new location
// @Description Create a new location for a business
// @Tags locations
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param location body dto.LocationRequest true "Location data"
// @Success 201 {object} dto.LocationResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/locations [post]
func (h *LocationHandler) CreateLocation(w http.ResponseWriter, r *http.Request) {
	businessID := chi.URLParam(r, "businessID")
	if businessID == "" {
		ErrorResponse(w, http.StatusBadRequest, "businessID is required")
		return
	}

	var req dto.LocationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusBadRequest, errs)
		return
	}
	
	location := &domain.Location{
		Name:        req.Name,
		Address:     req.Address,
		City:        req.City,
		ContactInfo: req.ContactInfo,
		Timezone:    req.Timezone,
	}

	if err := h.locationService.CreateLocation(r.Context(), businessID, location); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := dto.LocationResponse{
		ID:          location.ID,
		BusinessID:  location.BusinessID,
		Name:        location.Name,
		Address:     location.Address,
		City:        location.City,
		ContactInfo: location.ContactInfo,
		Timezone:    location.Timezone,
		CreatedAt:   location.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:   location.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// @Summary Get a location by ID
// @Description Get a specific location by its ID
// @Tags locations
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param locationID path string true "Location ID"
// @Success 200 {object} dto.LocationResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /api/v1/businesses/{businessID}/locations/{locationID} [get]
func (h *LocationHandler) GetLocation(w http.ResponseWriter, r *http.Request) {
	locationID := chi.URLParam(r, "locationID")
	if locationID == "" {
		ErrorResponse(w, http.StatusBadRequest, "locationID is required")
		return
	}

	location, err := h.locationService.GetLocationByID(r.Context(), locationID)
	if err != nil {
		ErrorResponse(w, http.StatusNotFound, "Location not found")
		return
	}

	response := dto.LocationResponse{
		ID:          location.ID,
		BusinessID:  location.BusinessID,
		Name:        location.Name,
		Address:     location.Address,
		City:        location.City,
		ContactInfo: location.ContactInfo,
		Timezone:    location.Timezone,
		CreatedAt:   location.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:   location.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	json.NewEncoder(w).Encode(response)
}

// @Summary Update a location
// @Description Update an existing location
// @Tags locations
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param locationID path string true "Location ID"
// @Param location body dto.LocationRequest true "Location data"
// @Success 200 {object} dto.LocationResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /api/v1/businesses/{businessID}/locations/{locationID} [put]
func (h *LocationHandler) UpdateLocation(w http.ResponseWriter, r *http.Request) {
	locationID := chi.URLParam(r, "locationID")
	if locationID == "" {
		ErrorResponse(w, http.StatusBadRequest, "locationID is required")
		return
	}

	var req dto.LocationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if errs := validate.Struct(req); errs != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}



	location, err := h.locationService.GetLocationByID(r.Context(), locationID)
	if err != nil {
		ErrorResponse(w, http.StatusNotFound, "Location not found")
		return
	}

	location.Name = req.Name
	location.Address = req.Address
	location.City = req.City
	location.ContactInfo = req.ContactInfo
	location.Timezone = req.Timezone

	if err := h.locationService.UpdateLocation(r.Context(), location); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := dto.LocationResponse{
		ID:          location.ID,
		BusinessID:  location.BusinessID,
		Name:        location.Name,
		Address:     location.Address,
		City:        location.City,
		ContactInfo: location.ContactInfo,
		Timezone:    location.Timezone,
		CreatedAt:   location.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:   location.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	json.NewEncoder(w).Encode(response)
}

// @Summary Delete a location
// @Description Delete a location by ID
// @Tags locations
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param locationID path string true "Location ID"
// @Success 204
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /api/v1/businesses/{businessID}/locations/{locationID} [delete]
func (h *LocationHandler) DeleteLocation(w http.ResponseWriter, r *http.Request) {
	locationID := chi.URLParam(r, "locationID")
	if locationID == "" {
		ErrorResponse(w, http.StatusBadRequest, "locationID is required")
		return
	}

	if err := h.locationService.DeleteLocation(r.Context(), locationID); err != nil {
		ErrorResponse(w, http.StatusNotFound, "Location not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
