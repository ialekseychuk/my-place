package dto

import "time"

type LocationRequest struct {
	BusinessID  string `json:"business_id" validate:"required,uuid4"`
	Name        string `json:"name" validate:"required"`
	Address     string `json:"address" validate:"required"`
	City        string `json:"city" validate:"required"`
	ContactInfo string `json:"contact_info"`
	Timezone    string `json:"timezone" validate:"required"`
	Currency    string `json:"currency"`
}

type LocationResponse struct {
	ID          string    `json:"id"`
	BusinessID  string    `json:"business_id"`
	Name        string    `json:"name"`
	Address     string    `json:"address"`
	City        string    `json:"city"`
	ContactInfo string    `json:"contact_info"`
	Timezone    string    `json:"timezone"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type LocationListResponse struct {
	Locations []LocationResponse `json:"locations"`
}
