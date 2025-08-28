package domain

import "time"

type Staff struct {
	ID             string
	BusinessID     string
	LocationID     string
	FirstName      string
	LastName       string
	Phone          string
	Gender         string // 'male', 'female', 'other', 'prefer_not_to_say'
	Position       string
	Description    string
	Specialization string
	IsActive       bool
	CreatedAt      time.Time
	UpdatedAt      time.Time
}
