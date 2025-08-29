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
	clientRepo  domain.ClientRepository
}

func NewBookingService(
	bookingRepo domain.BookingRepository,
	serviceRepo domain.ServiceRepository,
	staffRepo domain.StaffRepository,
	clientRepo domain.ClientRepository) *BookingService {
	return &BookingService{
		bookingRepo: bookingRepo,
		serviceRepo: serviceRepo,
		staffRepo:   staffRepo,
		clientRepo:  clientRepo,
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

	// Look up client by phone number within the business
	client, err := s.clientRepo.GetClientByPhone(ctx, businessID, req.CustomerPhone)
	if err != nil {
		// Client doesn't exist, create new client
		client = &domain.Client{
			BusinessID: businessID,
			Phone:      req.CustomerPhone,
			FirstName:  req.CustomerName,
			Email:      req.CustomerEmail,
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
		}
		if err := s.clientRepo.CreateClient(ctx, client); err != nil {
			return fmt.Errorf("failed to create client: %w", err)
		}
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

	// Determine location ID - use service's location if not provided
	locationID := req.LocationID
	if locationID == "" {
		locationID = service.LocationID
	}

	// Create the booking
	booking := &domain.Booking{
		ServiceID:  req.ServiceID,
		StaffID:    req.StaffID,
		ClientID:   client.ID,
		LocationID: locationID,
		StartAt:    req.StartAt,
		EndAt:      endAt,
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

func (s *BookingService) GetBookingsByBusiness(ctx context.Context, businessID string, startDate, endDate *time.Time) ([]*dto.BookingResponse, error) {
	// If endDate is provided, set it to the end of the day (23:59:59.999999999)
	var adjustedEndDate *time.Time
	if endDate != nil {
		endOfDay := time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23, 59, 59, 999999999, endDate.Location())
		adjustedEndDate = &endOfDay
	}

	bookings, err := s.bookingRepo.GetByBusinessID(ctx, businessID, startDate, adjustedEndDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get bookings: %w", err)
	}

	var bookingResponses []*dto.BookingResponse
	for _, booking := range bookings {
		// Get service name
		service, err := s.serviceRepo.GetById(ctx, booking.ServiceID)
		if err != nil {
			return nil, fmt.Errorf("failed to get service: %w", err)
		}

		// Get staff name
		staff, err := s.staffRepo.GetById(ctx, booking.StaffID)
		if err != nil {
			return nil, fmt.Errorf("failed to get staff: %w", err)
		}

		// Get client name
		var clientName string
		if booking.ClientID != "" {
			client, err := s.clientRepo.GetClientByID(ctx, booking.ClientID)
			if err == nil {
				clientName = fmt.Sprintf("%s %s", client.FirstName, client.LastName)
			}
		}

		bookingResponses = append(bookingResponses, &dto.BookingResponse{
			ID:           booking.ID,
			ServiceID:    booking.ServiceID,
			ServiceName:  service.Name,
			StaffID:      booking.StaffID,
			StaffName:    fmt.Sprintf("%s %s", staff.FirstName, staff.LastName),
			StartAt:      booking.StartAt,
			EndAt:        booking.EndAt,
			CustomerName: clientName,
			LocationID:   booking.LocationID,
			CreatedAt:    booking.CreatedAt,
			UpdatedAt:    booking.UpdatedAt,
		})
	}

	return bookingResponses, nil
}
