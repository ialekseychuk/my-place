package dto

type CreateServiceRequest struct {
	Name string `json:"name" validate:"required,min=3,max=100"`
	DurationMin int `json:"duration_min" validate:"required,min=1"`
	PriceCents int `json:"price_cents" validate:"required,min=1"`
}