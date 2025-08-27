package repository

import (
	"context"
	"time"

	"github.com/ialekseychuk/my-place/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type bookingRepository struct {
	db *pgxpool.Pool
}

func NewBookingRepository(db *pgxpool.Pool) domain.BookingRepository {
	return &bookingRepository{
		db: db,
	}
}

func (r *bookingRepository) Create(ctx context.Context, booking *domain.Booking) error {
	booking.CreatedAt = time.Now()
	booking.UpdatedAt = time.Now()

	err := r.db.QueryRow(ctx,
		`INSERT INTO bookings (service_id, staff_id, customer_name, customer_email, start_at, end_at, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING id`,
		booking.ServiceID, booking.StaffID, booking.CustomerName, booking.CustomerEmail,
		booking.StartAt, booking.EndAt, booking.CreatedAt, booking.UpdatedAt).Scan(&booking.ID)
	return err
}

func (r *bookingRepository) GetById(ctx context.Context, id string) (*domain.Booking, error) {
	var booking domain.Booking
	err := r.db.QueryRow(ctx,
		`SELECT id, service_id, staff_id, customer_name, customer_email, start_at, end_at, created_at, updated_at
		 FROM bookings
		 WHERE id = $1`,
		id).Scan(&booking.ID, &booking.ServiceID, &booking.StaffID, &booking.CustomerName,
		&booking.CustomerEmail, &booking.StartAt, &booking.EndAt, &booking.CreatedAt, &booking.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &booking, nil
}

func (r *bookingRepository) GetByBusinessID(ctx context.Context, businessID string, startDate, endDate *time.Time) ([]*domain.Booking, error) {
	var query string
	var args []interface{}

	baseQuery := `
		SELECT b.id, b.service_id, b.staff_id, b.customer_name, b.customer_email, 
		       b.start_at, b.end_at, b.created_at, b.updated_at
		FROM bookings b
		JOIN services s ON b.service_id = s.id
		WHERE s.business_id = $1
	`

	args = append(args, businessID)

	if startDate != nil && endDate != nil {
		query = baseQuery + ` AND b.start_at >= $2 AND b.start_at <= $3 ORDER BY b.start_at DESC`
		args = append(args, *startDate, *endDate)
	} else if startDate != nil {
		query = baseQuery + ` AND b.start_at >= $2 ORDER BY b.start_at DESC`
		args = append(args, *startDate)
	} else if endDate != nil {
		query = baseQuery + ` AND b.start_at <= $2 ORDER BY b.start_at DESC`
		args = append(args, *endDate)
	} else {
		query = baseQuery + ` ORDER BY b.start_at DESC`
	}

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bookings []*domain.Booking
	for rows.Next() {
		var booking domain.Booking
		err := rows.Scan(&booking.ID, &booking.ServiceID, &booking.StaffID, &booking.CustomerName,
			&booking.CustomerEmail, &booking.StartAt, &booking.EndAt, &booking.CreatedAt, &booking.UpdatedAt)
		if err != nil {
			return nil, err
		}
		bookings = append(bookings, &booking)
	}

	return bookings, rows.Err()
}

func (r *bookingRepository) GetByStaffAndTimeRange(ctx context.Context, staffID string, start, end time.Time) ([]*domain.Booking, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, service_id, staff_id, customer_name, customer_email, start_at, end_at, created_at, updated_at
		 FROM bookings
		 WHERE staff_id = $1 AND start_at < $3 AND end_at > $2
		 ORDER BY start_at`,
		staffID, start, end)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bookings []*domain.Booking
	for rows.Next() {
		var booking domain.Booking
		err := rows.Scan(&booking.ID, &booking.ServiceID, &booking.StaffID, &booking.CustomerName,
			&booking.CustomerEmail, &booking.StartAt, &booking.EndAt, &booking.CreatedAt, &booking.UpdatedAt)
		if err != nil {
			return nil, err
		}
		bookings = append(bookings, &booking)
	}

	return bookings, rows.Err()
}

func (r *bookingRepository) GetAvailableSlots(ctx context.Context, businessID string, staffID *string, day time.Time) ([]*domain.Slot, error) {
	// For simplicity, we'll generate slots from 9 AM to 6 PM with 30-minute intervals
	// In a real application, you would get staff working hours from the database

	startOfDay := time.Date(day.Year(), day.Month(), day.Day(), 9, 0, 0, 0, day.Location())
	endOfDay := time.Date(day.Year(), day.Month(), day.Day(), 18, 0, 0, 0, day.Location())
	slotDuration := 30 * time.Minute

	// Get staff members for this business
	var staffQuery string
	var args []interface{}
	if staffID != nil {
		staffQuery = `SELECT id FROM staff WHERE business_id = $1 AND id = $2`
		args = []interface{}{businessID, *staffID}
	} else {
		staffQuery = `SELECT id FROM staff WHERE business_id = $1`
		args = []interface{}{businessID}
	}

	staffRows, err := r.db.Query(ctx, staffQuery, args...)
	if err != nil {
		return nil, err
	}
	defer staffRows.Close()

	var staffIDs []string
	for staffRows.Next() {
		var id string
		if err := staffRows.Scan(&id); err != nil {
			return nil, err
		}
		staffIDs = append(staffIDs, id)
	}

	var slots []*domain.Slot
	for _, sID := range staffIDs {
		// Get existing bookings for this staff member on this day
		existingBookings, err := r.GetByStaffAndTimeRange(ctx, sID, startOfDay, endOfDay)
		if err != nil {
			return nil, err
		}

		// Generate available slots
		current := startOfDay
		for current.Before(endOfDay) {
			slotEnd := current.Add(slotDuration)

			// Check if this slot conflicts with any existing booking
			isAvailable := true
			for _, booking := range existingBookings {
				if current.Before(booking.EndAt) && slotEnd.After(booking.StartAt) {
					isAvailable = false
					break
				}
			}

			if isAvailable {
				slots = append(slots, &domain.Slot{
					StaffID: sID,
					Start:   current,
					End:     slotEnd,
				})
			}

			current = current.Add(slotDuration)
		}
	}

	return slots, nil
}
