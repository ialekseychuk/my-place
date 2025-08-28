package dto

import "time"

type CreateServiceRequest struct {
	Name        string `json:"name" validate:"required,min=3,max=100"`
	DurationMin int    `json:"duration_min" validate:"required,min=1"`
	PriceCents  int    `json:"price_cents" validate:"required,min=1"`
	LocationID  string `json:"location_id" validate:"omitempty"`
	CategoryID  string `json:"category_id" validate:"omitempty"`
}

type UpdateServiceRequest struct {
	Name        string `json:"name" validate:"omitempty,min=3,max=100"`
	DurationMin int    `json:"duration_min" validate:"omitempty,min=1"`
	PriceCents  int    `json:"price_cents" validate:"omitempty,min=1"`
	LocationID  string `json:"location_id" validate:"omitempty"`
	CategoryID  string `json:"category_id" validate:"omitempty"`
}

type ServiceResponse struct {
	ID          string    `json:"id"`
	BusinessID  string    `json:"business_id"`
	LocationID  string    `json:"location_id"`
	Name        string    `json:"name"`
	DurationMin int       `json:"duration_min"`
	PriceCents  int       `json:"price_cents"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
