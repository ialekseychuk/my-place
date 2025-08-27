package dto

import "time"

type CreateBookingRequest struct {
	ServiceID     string    `json:"service_id"     validate:"required,uuid4"`
	StaffID       string    `json:"staff_id"       validate:"required,uuid4"`
	StartAt       time.Time `json:"start_at"       validate:"required"`
	CustomerName  string    `json:"customer_name"  validate:"required,min=2,max=100"`
	CustomerEmail string    `json:"customer_email" validate:"required,email"`
}

type BookingResponse struct {
	ID            string    `json:"id"`
	ServiceID     string    `json:"service_id"`
	ServiceName   string    `json:"service_name"`
	StaffID       string    `json:"staff_id"`
	StaffName     string    `json:"staff_name"`
	StartAt       time.Time `json:"start_at"`
	EndAt         time.Time `json:"end_at"`
	CustomerName  string    `json:"customer_name"`
	CustomerEmail string    `json:"customer_email"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type SlotResponse struct {
	StaffID string    `json:"staff_id"`
	Start   time.Time `json:"start"`
	End     time.Time `json:"end"`
}
