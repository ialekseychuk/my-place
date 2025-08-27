package domain

import (
	"context"
	"time"
)

type BookingRepository interface {
	Create(ctx context.Context, booking *Booking) error
	GetById(ctx context.Context, id string) (*Booking, error)
	GetByBusinessID(ctx context.Context, businessID string, startDate, endDate *time.Time) ([]*Booking, error)
	GetByStaffAndTimeRange(ctx context.Context, staffID string, start, end time.Time) ([]*Booking, error)
	GetAvailableSlots(ctx context.Context, businessID string, staffID *string, day time.Time) ([]*Slot, error)
}
