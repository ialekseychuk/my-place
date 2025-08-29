package dto

import (
	"encoding/json"
	"fmt"
	"time"
)

type CreateBookingRequest struct {
	ServiceID     string    `json:"service_id"     validate:"required,uuid4"`
	StaffID       string    `json:"staff_id"       validate:"required,uuid4"`
	StartAt       time.Time `json:"start_at"       validate:"required"`
	CustomerPhone string    `json:"customer_phone" validate:"required"`
	CustomerName  string    `json:"customer_name"  validate:"required,min=2,max=100"`
	CustomerEmail string    `json:"customer_email" validate:"omitempty,email"`
	LocationID    string    `json:"location_id"    validate:"omitempty,uuid4"`
}

// Custom UnmarshalJSON to handle ISO date format
func (r *CreateBookingRequest) UnmarshalJSON(data []byte) error {
	type Alias CreateBookingRequest
	aux := &struct {
		StartAt string `json:"start_at"`
		*Alias
	}{
		Alias: (*Alias)(r),
	}
	
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	
	// Parse ISO date format
	parsedTime, err := time.Parse(time.RFC3339, aux.StartAt)
	if err != nil {
		// Try alternative format if RFC3339 fails
		parsedTime, err = time.Parse("2006-01-02T15:04:05", aux.StartAt)
		if err != nil {
			return fmt.Errorf("invalid date format for start_at: %w", err)
		}
	}
	
	r.StartAt = parsedTime
	r.ServiceID = aux.ServiceID
	r.StaffID = aux.StaffID
	r.CustomerPhone = aux.CustomerPhone
	r.CustomerName = aux.CustomerName
	r.CustomerEmail = aux.CustomerEmail
	r.LocationID = aux.LocationID
	return nil
}

type BookingResponse struct {
	ID           string    `json:"id"`
	ServiceID    string    `json:"service_id"`
	ServiceName  string    `json:"service_name"`
	StaffID      string    `json:"staff_id"`
	StaffName    string    `json:"staff_name"`
	StartAt      time.Time `json:"start_at"`
	EndAt        time.Time `json:"end_at"`
	ClientID     string    `json:"client_id"`
	CustomerName string    `json:"customer_name"`
	LocationID   string    `json:"location_id"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type SlotResponse struct {
	StaffID string    `json:"staff_id"`
	Start   time.Time `json:"start"`
	End     time.Time `json:"end"`
}