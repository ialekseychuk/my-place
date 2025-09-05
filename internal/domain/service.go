package domain

import "time"

type Service struct {
	ID          string
	BusinessID  string
	LocationID  string
	Name        string
	DurationMin int
	PriceCents  int
	CategoryID  string 
	OrderIndex  int  
	CreatedAt   time.Time
	UpdatedAt   time.Time
}


type ServiceCategory struct {
	ID         string
	BusinessID string
	Name       string
	OrderIndex int     
	CreatedAt  time.Time
	UpdatedAt  time.Time
}