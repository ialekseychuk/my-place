package domain

import "time"

type Slot struct {
	StaffID string
	Start   time.Time
	End     time.Time
}