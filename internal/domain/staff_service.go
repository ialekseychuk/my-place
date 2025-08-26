package domain

import "time"

type StaffService struct {
	ID        string    `json:"id"`
	StaffID   string    `json:"staff_id"`
	ServiceID string    `json:"service_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type StaffServiceWithDetails struct {
	ID          string    `json:"id"`
	StaffID     string    `json:"staff_id"`
	ServiceID   string    `json:"service_id"`
	StaffName   string    `json:"staff_name"`
	ServiceName string    `json:"service_name"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
