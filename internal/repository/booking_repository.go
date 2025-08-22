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

func NewBookingRepository(db *pgxpool.Pool) *bookingRepository {
	return &bookingRepository{
		db: db,
	}
}

func (r *bookingRepository) Create(ctx context.Context, b *domain.Booking) (error) {
	b.CreatedAt = time.Now()
	b.UpdatedAt = time.Now()

	err := r.db.QueryRow(ctx,
	`INSERT INTO bookings 
	(service_id, staff_id, start_at, ends_at, customer_name, customer_email, created_at, updated_at)
	 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
	 RETURNING id`,
	b.ServiceID, b.StaffID, b.StartAt, b.EndAt, b.CustomerName, b.CustomerEmail, b.CreatedAt, b.UpdatedAt,
	).Scan(&b.ID)

	return err
}

func (r *bookingRepository) ListByStaffAndDay(ctx context.Context,
	staffID string, day time.Time) ([]domain.Booking, error) {

	start := time.Date(day.Year(), day.Month(), day.Day(), 0, 0, 0, 0, day.Location())
	end := start.Add(24 * time.Hour)

	rows, err := r.db.Query(ctx,
		`SELECT id, service_id, staff_id, starts_at, ends_at,
		        customer_name, customer_email, created_at
		 FROM bookings
		 WHERE staff_id=$1 AND starts_at >= $2 AND starts_at < $3
		 ORDER BY starts_at`, staffID, start, end)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var res []domain.Booking
	for rows.Next() {
		var b domain.Booking
		if err := rows.Scan(&b.ID, &b.ServiceID, &b.StaffID,
			&b.StartAt, &b.EndAt, &b.CustomerName,
			&b.CustomerEmail, &b.CreatedAt); err != nil {
			return nil, err
		}
		res = append(res, b)
	}
	return res, rows.Err()
}

func (r *bookingRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM bookings WHERE id=$1`, id)
	return err
}