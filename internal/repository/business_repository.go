package repository

import (
	"context"
	"time"

	"github.com/ialekseychuk/my-place/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type businessRepository struct {
	db *pgxpool.Pool
}

func NewBusinessRepository(db *pgxpool.Pool) domain.BusinessRepository {
	return &businessRepository{
		db: db,
	}
}

func (r *businessRepository) GetById(ctx context.Context, id string) (*domain.Business, error) {
	var b domain.Business
	err := r.db.QueryRow(ctx,
		`SELECT id, name, business_type, description, address, city, phone, email, website, timezone, currency,
			enable_online_booking, enable_sms_notifications, enable_email_notifications, 
			created_at, updated_at
	 FROM businesses
	 WHERE id = $1`,
		id).Scan(&b.ID, &b.Name, &b.BusinessType, &b.Description, &b.Address, &b.City, &b.Phone,
		&b.Email, &b.Website, &b.Timezone, &b.Currency, &b.EnableOnlineBooking,
		&b.EnableSMSNotifications, &b.EnableEmailNotifications, &b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return &b, nil
}

func (r *businessRepository) Create(ctx context.Context, b *domain.Business) error {
	b.CreatedAt = time.Now()
	b.UpdatedAt = time.Now()

	err := r.db.QueryRow(ctx,
		`INSERT INTO businesses (id, name, business_type, description, address, city, phone, email, website, 
							 timezone, currency, enable_online_booking, enable_sms_notifications, 
							 enable_email_notifications, created_at, updated_at)
	 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
	 RETURNING id`,
		b.ID, b.Name, b.BusinessType, b.Description, b.Address, b.City, b.Phone, b.Email, b.Website,
		b.Timezone, b.Currency, b.EnableOnlineBooking, b.EnableSMSNotifications, b.EnableEmailNotifications,
		b.CreatedAt, b.UpdatedAt).Scan(&b.ID)
	return err
}
