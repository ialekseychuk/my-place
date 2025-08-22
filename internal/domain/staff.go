package domain

import "time"

type Staff struct {
	ID         string
	BusinessID string
	FullName   string
	CreatedAt  time.Time
	UpdatedAt  time.Time
}