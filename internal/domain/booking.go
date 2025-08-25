package domain

import "time"

type Booking struct {
	ID            string
	ServiceID     string
	StaffID       string
	StartAt       time.Time
	EndAt         time.Time
	CustomerName  string
	CustomerEmail string
	CreatedAt     time.Time
	UpdatedAt     time.Time
}
