package domain

import "time"

type BusinessWorkingHours struct {
	ID         string    `json:"id"`
	BusinessID string    `json:"business_id"`
	DayOfWeek  int       `json:"day_of_week"` // 0=Sunday, 1=Monday, ..., 6=Saturday
	StartTime  string    `json:"start_time"`  // Format: "HH:MM" (e.g., "09:00")
	EndTime    string    `json:"end_time"`    // Format: "HH:MM" (e.g., "18:00")
	IsEnabled  bool      `json:"is_enabled"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
