package dto

import "time"

type CreateBookingRequest struct {
	ServiceID     string    `json:"service_id"     validate:"required,uuid4"`
	StaffID       string    `json:"staff_id"       validate:"required,uuid4"`
	StartAt       time.Time `json:"start_at"       validate:"required"`
	CustomerPhone string    `json:"customer_phone" validate:"required"`
	CustomerName  string    `json:"customer_name"  validate:"required,min=2,max=100"`
	CustomerEmail string    `json:"customer_email" validate:"omitempty,email"`
}

type BookingResponse struct {
	ID          string    `json:"id"`
	ServiceID   string    `json:"service_id"`
	ServiceName string    `json:"service_name"`
	StaffID     string    `json:"staff_id"`
	StaffName   string    `json:"staff_name"`
	StartAt     time.Time `json:"start_at"`
	EndAt       time.Time `json:"end_at"`
	ClientID    string    `json:"client_id"`
	CustomerName string   `json:"customer_name"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type SlotResponse struct {
	StaffID string    `json:"staff_id"`
	Start   time.Time `json:"start"`
	End     time.Time `json:"end"`
}