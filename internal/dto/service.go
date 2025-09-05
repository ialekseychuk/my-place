package dto

import "time"

type CreateServiceRequest struct {
	Name        string `json:"name" validate:"required,min=3,max=100"`
	DurationMin int    `json:"duration_min" validate:"required,min=1"`
	PriceCents  int    `json:"price_cents" validate:"required,min=1"`
	LocationID  string `json:"location_id" validate:"omitempty"`
	CategoryID  string `json:"category_id" validate:"omitempty"`
	OrderIndex  int    `json:"order_index" validate:"omitempty,min=0"`
}

type UpdateServiceRequest struct {
	Name        string `json:"name" validate:"omitempty,min=3,max=100"`
	DurationMin int    `json:"duration_min" validate:"omitempty,min=1"`
	PriceCents  int    `json:"price_cents" validate:"omitempty,min=1"`
	LocationID  string `json:"location_id" validate:"omitempty"`
	CategoryID  string `json:"category_id" validate:"omitempty"`
	OrderIndex  int    `json:"order_index" validate:"omitempty,min=0"`
}

type ServiceResponse struct {
	ID          string    `json:"id"`
	BusinessID  string    `json:"business_id"`
	LocationID  string    `json:"location_id"`
	Name        string    `json:"name"`
	DurationMin int       `json:"duration_min"`
	PriceCents  int       `json:"price_cents"`
	CategoryID  string    `json:"category_id,omitempty"`
	OrderIndex  int       `json:"order_index"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Category DTOs
type CreateCategoryRequest struct {
	Name       string `json:"name" validate:"required,min=3,max=100"`
	OrderIndex int    `json:"order_index" validate:"omitempty,min=0"`
}

type UpdateCategoryRequest struct {
	Name       string `json:"name" validate:"omitempty,min=3,max=100"`
	OrderIndex int    `json:"order_index" validate:"omitempty,min=0"`
}

type CategoryResponse struct {
	ID         string    `json:"id"`
	BusinessID string    `json:"business_id"`
	Name       string    `json:"name"`
	OrderIndex int       `json:"order_index"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type UpdateOrderRequest struct {
	IDs []string `json:"ids" validate:"required,min=1"`
}

type CategoryWithServices struct {
	CategoryResponse
	Services []ServiceResponse `json:"services"`
}

type BusinessServicesResponse struct {
	Categories []CategoryWithServices `json:"categories"`
	Services   []ServiceResponse      `json:"uncategorized_services,omitempty"`
}