package domain

import (
	"context"
	"time"
)

type BookingRepository interface {
	Create(ctx context.Context, b *Booking) error
	ListByStaffAndDay(ctx context.Context, staffID string, day time.Time) ([]Booking, error)
	Delete(ctx context.Context, id string) error
}
