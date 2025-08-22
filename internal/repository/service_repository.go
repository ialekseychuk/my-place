package repository

import (
	"context"
	"time"

	"github.com/ialekseychuk/my-place/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)


type serviceRepository struct {
	db *pgxpool.Pool
}

func NewServiceRepository(db *pgxpool.Pool) *serviceRepository {
	return &serviceRepository{
		db: db,
	}
}

func (r *serviceRepository) Create(ctx context.Context, s *domain.Service) (error) {
	s.CreatedAt = time.Now()
	s.UpdatedAt = time.Now()

	err := r.db.QueryRow(ctx,
	`INSERT INTO services 
	(business_id, name, duration_min, price_cents, created_at, updated_at)
	 VALUES ($1,$2,$3,$4, $5, $6)
	 RETURNING id`,
	s.BusinessID, s.Name, s.DurationMin, s.PriceCents, s.CreatedAt, s.UpdatedAt,
	).Scan(&s.ID)

	return err
}

func (r *serviceRepository) ListByBusinessId(ctx context.Context, businessId string) ([]domain.Service, error) {
	var services []domain.Service
	rows, _ := r.db.Query(ctx,
		`SELECT id, business_id, name, duration_min, price_cents, created_at, updated_at
		 FROM services
		 WHERE business_id = $1`,
		businessId,
	)
	for rows.Next() {
		var s domain.Service
		rows.Scan(&s.ID, &s.BusinessID, &s.Name, &s.DurationMin, &s.PriceCents, &s.CreatedAt, &s.UpdatedAt)
		services = append(services, s)
	}

	return services, rows.Err()
}