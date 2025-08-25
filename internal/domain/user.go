package domain

import "time"

type User struct {
	ID         string    `json:"id"`
	BusinessID string    `json:"business_id"`
	FirstName  string    `json:"first_name"`
	LastName   string    `json:"last_name"`
	Email      string    `json:"email"`
	Phone      string    `json:"phone"`
	Password   string    `json:"-"`    // Don't return password in JSON responses
	Role       string    `json:"role"` // owner, admin, staff
	IsActive   bool      `json:"is_active"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
