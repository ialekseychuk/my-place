package domain

import "time"

type Booking struct {
	ID            string
	ServiceID     string
	StaffID       string
	StartsAt       time.Time
	EndsAt        time.Time
	CustomerName  string
	CustomerEmail string
	CreatedAt     time.Time
	UpdatedAt     time.Time
}
