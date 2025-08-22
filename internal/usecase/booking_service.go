package usecase

import (
	"context"
	"time"

	"github.com/ialekseychuk/my-place/internal/domain"
)

type BookingService struct {
	bookingRepo domain.BookingRepository
	serviceRepo domain.ServiceRepository
	staffRepo   domain.StaffRepository
}

func NewBookingUseCase(br domain.BookingRepository, sr domain.ServiceRepository, stfr domain.StaffRepository) *BookingService {
	return &BookingService{
		bookingRepo: br,
		serviceRepo: sr,
		staffRepo:   stfr,
	}
}

func (s *BookingService) Availability(ctx context.Context, businessID string, staffID string, day time.Time) ([]domain.Slot, error) {
	start := time.Date(day.Year(), day.Month(), day.Day(), 9, 0, 0, 0, day.Location())
	end := start.Add(9 * time.Hour)

	bookings, err := s.bookingRepo.ListByStaffAndDay(ctx, staffID, day)
	if err != nil {
		return nil, err
	}

	var slots []domain.Slot
	for slotStart := start; slotStart.Before(end); slotStart = slotStart.Add(15 * time.Minute) {
		slotEnd := slotStart.Add(30 * time.Minute)
		busy := false

		for _, b := range bookings {
			if b.StartAt.Before(slotEnd) && b.EndAt.After(slotStart) {
				busy = true
				break
			}
		}
		if !busy {
			slots = append(slots, domain.Slot{
				StaffID: staffID,
				Start:   slotStart,
				End:     slotEnd,
			})
		}

	}
	return slots, nil
}

func (s *BookingService) Book(ctx context.Context, b *domain.Booking) error {
	return s.bookingRepo.Create(ctx, b)
}
