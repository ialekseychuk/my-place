package domain

import "time"

type Location struct {
	ID          string
	BusinessID  string
	Name        string
	Address     string
	City        string
	ContactInfo string
	Timezone    string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
