package dto

import "time"

type CreateStaffRequest struct {
	FirstName      string `json:"first_name" validate:"required,min=2,max=50"`
	LastName       string `json:"last_name" validate:"required,min=2,max=50"`
	Phone          string `json:"phone" validate:"omitempty,min=10,max=20"`
	Gender         string `json:"gender" validate:"omitempty,oneof=male female other prefer_not_to_say"`
	Position       string `json:"position" validate:"required,min=2,max=100"`
	Description    string `json:"description" validate:"omitempty,max=500"`
	Specialization string `json:"specialization" validate:"omitempty,max=100"`
	LocationID     string `json:"location_id" validate:"omitempty,uuid4"`
}

type UpdateStaffRequest struct {
	FirstName      string `json:"first_name" validate:"omitempty,min=2,max=50"`
	LastName       string `json:"last_name" validate:"omitempty,min=2,max=50"`
	Phone          string `json:"phone" validate:"omitempty,min=10,max=20"`
	Gender         string `json:"gender" validate:"omitempty,oneof=male female other prefer_not_to_say"`
	Position       string `json:"position" validate:"omitempty,min=2,max=100"`
	Description    string `json:"description" validate:"omitempty,max=500"`
	Specialization string `json:"specialization" validate:"omitempty,max=100"`
	IsActive       *bool  `json:"is_active" validate:"omitempty"`
	LocationID     string `json:"location_id" validate:"omitempty,uuid4"`
}

type StaffResponse struct {
	ID             string    `json:"id"`
	BusinessID     string    `json:"business_id"`
	LocationID     string    `json:"location_id"`
	FirstName      string    `json:"first_name"`
	LastName       string    `json:"last_name"`
	FullName       string    `json:"full_name"` // computed field: FirstName + LastName
	Phone          string    `json:"phone,omitempty"`
	Gender         string    `json:"gender,omitempty"`
	Position       string    `json:"position"`
	Description    string    `json:"description,omitempty"`
	Specialization string    `json:"specialization,omitempty"`
	IsActive       bool      `json:"is_active"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}
