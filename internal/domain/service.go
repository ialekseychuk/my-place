package domain

import "time"

type Service struct {
	ID   string
	BusinessID string
	Name string
	DurationMin int
	PriceCents int
	CreatedAt time.Time
	UpdatedAt time.Time
}