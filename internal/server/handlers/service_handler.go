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

	// Service routes
	r.Post("/", h.createService)
	r.Get("/", h.getServicesByBusiness)
	r.Get("/{serviceID}", h.getService)
	r.Put("/{serviceID}", h.updateService)
	r.Delete("/{serviceID}", h.deleteService)
	r.Put("/order", h.updateServicesOrder)

	// Category routes
	r.Route("/categories", func(r chi.Router) {
		r.Post("/", h.createCategory)
		r.Get("/", h.getCategories)
		r.Get("/{categoryID}", h.getCategory)
		r.Put("/{categoryID}", h.updateCategory)
		r.Delete("/{categoryID}", h.deleteCategory)
		r.Get("/{categoryID}/services", h.getServicesByCategory)
		r.Put("/order", h.updateCategoriesOrder)
	})

	// Combined routes
	r.Get("/with-categories", h.getServicesWithCategories)

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
		CategoryID:  req.CategoryID,
		OrderIndex:  req.OrderIndex,
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
	// Update category ID (allow setting to empty string to remove from category)
	if req.CategoryID != service.CategoryID {
		service.CategoryID = req.CategoryID
	}
	// Update order index if provided
	if req.OrderIndex >= 0 {
		service.OrderIndex = req.OrderIndex
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

// @Summary Update services order
// @Description Update the order of services for drag and drop functionality
// @Tags Service
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param order body dto.UpdateOrderRequest true "Service IDs in the desired order"
// @Success 204
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/services/order [put]
func (h *ServiceHandler) updateServicesOrder(w http.ResponseWriter, r *http.Request) {
	var req dto.UpdateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	if err := h.uc.UpdateServiceOrder(r.Context(), req.IDs); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Category handlers

// @Summary Create a new service category
// @Description Creates a new service category for business
// @Tags ServiceCategory
// @Accept json
// @Produce json
// @Param category body dto.CreateCategoryRequest true "Category object"
// @Param businessID path string true "Business ID"
// @Success 201 {object} dto.CategoryResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/services/categories [post]
func (h *ServiceHandler) createCategory(w http.ResponseWriter, r *http.Request) {
	businessID := chi.URLParam(r, "businessID")

	var req dto.CreateCategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	category := &domain.ServiceCategory{
		BusinessID: businessID,
		Name:       req.Name,
		OrderIndex: req.OrderIndex,
	}

	if err := h.uc.CreateCategory(r.Context(), category); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	response := h.convertToCategoryResponse(category)
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// @Summary Get categories by business
// @Description Get all service categories for a business
// @Tags ServiceCategory
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Success 200 {array} dto.CategoryResponse
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/services/categories [get]
func (h *ServiceHandler) getCategories(w http.ResponseWriter, r *http.Request) {
	businessID := chi.URLParam(r, "businessID")

	categories, err := h.uc.ListCategoriesByBusinessId(r.Context(), businessID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	var responses []dto.CategoryResponse
	for _, category := range categories {
		responses = append(responses, h.convertToCategoryResponse(&category))
	}

	json.NewEncoder(w).Encode(responses)
}

// @Summary Get category by ID
// @Description Get a specific service category by ID
// @Tags ServiceCategory
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param categoryID path string true "Category ID"
// @Success 200 {object} dto.CategoryResponse
// @Failure 404 {object} dto.ErrorResponse "Category not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/services/categories/{categoryID} [get]
func (h *ServiceHandler) getCategory(w http.ResponseWriter, r *http.Request) {
	categoryID := chi.URLParam(r, "categoryID")

	category, err := h.uc.GetCategoryById(r.Context(), categoryID)
	if err != nil {
		ErrorResponse(w, http.StatusNotFound, "Category not found")
		return
	}

	response := h.convertToCategoryResponse(category)
	json.NewEncoder(w).Encode(response)
}

// @Summary Update category
// @Description Update service category information
// @Tags ServiceCategory
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param categoryID path string true "Category ID"
// @Param category body dto.UpdateCategoryRequest true "Category update data"
// @Success 200 {object} dto.CategoryResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 404 {object} dto.ErrorResponse "Category not found"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/services/categories/{categoryID} [put]
func (h *ServiceHandler) updateCategory(w http.ResponseWriter, r *http.Request) {
	categoryID := chi.URLParam(r, "categoryID")

	// Get existing category
	category, err := h.uc.GetCategoryById(r.Context(), categoryID)
	if err != nil {
		ErrorResponse(w, http.StatusNotFound, "Category not found")
		return
	}

	var req dto.UpdateCategoryRequest
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
		category.Name = req.Name
	}
	if req.OrderIndex >= 0 {
		category.OrderIndex = req.OrderIndex
	}

	if err := h.uc.UpdateCategory(r.Context(), category); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	response := h.convertToCategoryResponse(category)
	json.NewEncoder(w).Encode(response)
}

// @Summary Delete category
// @Description Delete a service category by ID
// @Tags ServiceCategory
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param categoryID path string true "Category ID"
// @Success 204
// @Failure 404 {object} dto.ErrorResponse "Category not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/services/categories/{categoryID} [delete]
func (h *ServiceHandler) deleteCategory(w http.ResponseWriter, r *http.Request) {
	categoryID := chi.URLParam(r, "categoryID")

	if err := h.uc.DeleteCategory(r.Context(), categoryID); err != nil {
		ErrorResponse(w, http.StatusNotFound, "Category not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// @Summary Get services by category
// @Description Get all services in a specific category
// @Tags ServiceCategory
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param categoryID path string true "Category ID"
// @Success 200 {array} dto.ServiceResponse
// @Failure 404 {object} dto.ErrorResponse "Category not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/services/categories/{categoryID}/services [get]
func (h *ServiceHandler) getServicesByCategory(w http.ResponseWriter, r *http.Request) {
	categoryID := chi.URLParam(r, "categoryID")

	services, err := h.uc.ListServicesByCategoryId(r.Context(), categoryID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	var responses []dto.ServiceResponse
	for _, service := range services {
		responses = append(responses, h.convertToServiceResponse(&service))
	}

	json.NewEncoder(w).Encode(responses)
}

// @Summary Update categories order
// @Description Update the order of categories for drag and drop functionality
// @Tags ServiceCategory
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Param order body dto.UpdateOrderRequest true "Category IDs in the desired order"
// @Success 204
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/services/categories/order [put]
func (h *ServiceHandler) updateCategoriesOrder(w http.ResponseWriter, r *http.Request) {
	var req dto.UpdateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	if err := h.uc.UpdateCategoryOrder(r.Context(), req.IDs); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// @Summary Get services with categories
// @Description Get all services for a business grouped by categories
// @Tags Service
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Success 200 {object} dto.BusinessServicesResponse
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/services/with-categories [get]
func (h *ServiceHandler) getServicesWithCategories(w http.ResponseWriter, r *http.Request) {
	businessID := chi.URLParam(r, "businessID")

	// Get all categories with their services
	servicesMap, err := h.uc.GetBusinessServicesWithCategories(r.Context(), businessID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	// Get all categories
	categories, err := h.uc.ListCategoriesByBusinessId(r.Context(), businessID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	// Build response
	response := dto.BusinessServicesResponse{}

	// Add categorized services
	for _, category := range categories {
		if services, exists := servicesMap[category.ID]; exists {
			var serviceResponses []dto.ServiceResponse
			for _, service := range services {
				serviceResponses = append(serviceResponses, h.convertToServiceResponse(&service))
			}

			categoryWithServices := dto.CategoryWithServices{
				CategoryResponse: h.convertToCategoryResponse(&category),
				Services:         serviceResponses,
			}

			response.Categories = append(response.Categories, categoryWithServices)
		} else {
			// Category exists but has no services
			categoryWithServices := dto.CategoryWithServices{
				CategoryResponse: h.convertToCategoryResponse(&category),
				Services:         []dto.ServiceResponse{},
			}

			response.Categories = append(response.Categories, categoryWithServices)
		}
	}

	// Add uncategorized services
	if uncategorizedServices, exists := servicesMap[""]; exists && len(uncategorizedServices) > 0 {
		var serviceResponses []dto.ServiceResponse
		for _, service := range uncategorizedServices {
			serviceResponses = append(serviceResponses, h.convertToServiceResponse(&service))
		}
		response.Services = serviceResponses
	}

	json.NewEncoder(w).Encode(response)
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
		CategoryID:  service.CategoryID,
		OrderIndex:  service.OrderIndex,
		CreatedAt:   service.CreatedAt,
		UpdatedAt:   service.UpdatedAt,
	}
}

// Helper method to convert domain.ServiceCategory to dto.CategoryResponse
func (h *ServiceHandler) convertToCategoryResponse(category *domain.ServiceCategory) dto.CategoryResponse {
	return dto.CategoryResponse{
		ID:         category.ID,
		BusinessID: category.BusinessID,
		Name:       category.Name,
		OrderIndex: category.OrderIndex,
		CreatedAt:  category.CreatedAt,
		UpdatedAt:  category.UpdatedAt,
	}
}
