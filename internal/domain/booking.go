package domain

import "time"

type Booking struct {
	ID         string    `json:"id"`
	ServiceID  string    `json:"service_id"`
	StaffID    string    `json:"staff_id"`
	ClientID   string    `json:"client_id"`
	LocationID string    `json:"location_id"`
	StartAt    time.Time `json:"start_at"`
	EndAt      time.Time `json:"end_at"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
