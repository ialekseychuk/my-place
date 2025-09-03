package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

type ServiceCategoryHandler struct {

}


func NewServiceCategoryHandler() *ServiceCategoryHandler {
	return &ServiceCategoryHandler{}
}

func (h *ServiceCategoryHandler) Routes() chi.Router {
	r := chi.NewRouter()

	r.Route("/service-categories", func(r chi.Router) {
		r.Get("/", h.GetAllServiceCategories)
		r.Get("/{id}", h.GetServiceCategoryById)
		r.Post("/", h.CreateServiceCategory)
		r.Put("/{id}", h.UpdateServiceCategory)
	})
	return r
}

func (h *ServiceCategoryHandler) GetAllServiceCategories(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement this
}

func (h *ServiceCategoryHandler) GetServiceCategoryById(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement this
}

func (h *ServiceCategoryHandler) CreateServiceCategory(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement this
}

func (h *ServiceCategoryHandler) UpdateServiceCategory(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement this
}