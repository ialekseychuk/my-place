package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/ialekseychuk/my-place/internal/domain"
	"github.com/ialekseychuk/my-place/internal/dto"
)

type BookingService struct {
	bookingRepo domain.BookingRepository
	serviceRepo domain.ServiceRepository
	staffRepo   domain.StaffRepository
}

func NewBookingService(bookingRepo domain.BookingRepository, serviceRepo domain.ServiceRepository, staffRepo domain.StaffRepository) *BookingService {
	return &BookingService{
		bookingRepo: bookingRepo,
		serviceRepo: serviceRepo,
		staffRepo:   staffRepo,
	}
}

func (s *BookingService) CreateBooking(ctx context.Context, businessID string, req *dto.CreateBookingRequest) error {
	// Validate that the service exists and belongs to the business
	service, err := s.serviceRepo.GetById(ctx, req.ServiceID)
	if err != nil {
		return fmt.Errorf("service not found: %w", err)
	}
	if service.BusinessID != businessID {
		return fmt.Errorf("service does not belong to this business")
	}

	// Validate that the staff exists and belongs to the business
	staff, err := s.staffRepo.GetById(ctx, req.StaffID)
	if err != nil {
		return fmt.Errorf("staff not found: %w", err)
	}
	if staff.BusinessID != businessID {
		return fmt.Errorf("staff does not belong to this business")
	}

	// Calculate end time based on service duration
	endAt := req.StartAt.Add(time.Duration(service.DurationMin) * time.Minute)

	// Check for overlapping bookings
	existingBookings, err := s.bookingRepo.GetByStaffAndTimeRange(ctx, req.StaffID, req.StartAt, endAt)
	if err != nil {
		return fmt.Errorf("failed to check existing bookings: %w", err)
	}
	if len(existingBookings) > 0 {
		return fmt.Errorf("time slot is not available")
	}

	// Create the booking
	booking := &domain.Booking{
		ServiceID:     req.ServiceID,
		StaffID:       req.StaffID,
		StartAt:       req.StartAt,
		EndAt:         endAt,
		CustomerName:  req.CustomerName,
		CustomerEmail: req.CustomerEmail,
	}

	return s.bookingRepo.Create(ctx, booking)
}

func (s *BookingService) GetAvailableSlots(ctx context.Context, businessID string, staffID *string, day time.Time) ([]*dto.SlotResponse, error) {
	slots, err := s.bookingRepo.GetAvailableSlots(ctx, businessID, staffID, day)
	if err != nil {
		return nil, fmt.Errorf("failed to get available slots: %w", err)
	}

	var slotResponses []*dto.SlotResponse
	for _, slot := range slots {
		slotResponses = append(slotResponses, &dto.SlotResponse{
			StaffID: slot.StaffID,
			Start:   slot.Start,
			End:     slot.End,
		})
	}

	return slotResponses, nil
}
