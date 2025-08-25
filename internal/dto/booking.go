package dto

import "time"

type CreateBookingRequest struct {
	ServiceID     string    `json:"service_id"     validate:"required,uuid4"`
	StaffID       string    `json:"staff_id"       validate:"required,uuid4"`
	StartAt       time.Time `json:"start_at"       validate:"required"`
	CustomerName  string    `json:"customer_name"  validate:"required,min=2,max=100"`
	CustomerEmail string    `json:"customer_email" validate:"required,email"`
}

type SlotResponse struct {
	StaffID string    `json:"staff_id"`
	Start   time.Time `json:"start"`
	End     time.Time `json:"end"`
}
