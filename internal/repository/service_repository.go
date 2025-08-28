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

func (r *serviceRepository) Create(ctx context.Context, s *domain.Service) error {
	err := r.db.QueryRow(ctx,
	`INSERT INTO services 
	(business_id, location_id, name, duration_min, price_cents)
	 VALUES ($1,$2,$3,$4,$5)
	 RETURNING id`,
		s.BusinessID, s.LocationID,  s.Name, s.DurationMin, s.PriceCents,
	).Scan(&s.ID)

	return err
}

func (r *serviceRepository) ListByBusinessId(ctx context.Context, businessId string) ([]domain.Service, error) {
	var services []domain.Service
	rows, _ := r.db.Query(ctx,
		`SELECT id, business_id, location_id, name, duration_min, price_cents, created_at, updated_at
		 FROM services
		 WHERE business_id = $1`,
		businessId,
	)
	for rows.Next() {
		var s domain.Service
		rows.Scan(&s.ID, &s.BusinessID, &s.LocationID,  &s.Name, &s.DurationMin, &s.PriceCents, &s.CreatedAt, &s.UpdatedAt)
		services = append(services, s)
	}

	return services, rows.Err()
}

func (r *serviceRepository) GetById(ctx context.Context, id string) (*domain.Service, error) {
	var s domain.Service
	err := r.db.QueryRow(ctx,
		`SELECT id, business_id, location_id, name, duration_min, price_cents, created_at, updated_at
	 FROM services
	 WHERE id = $1`,
		id).Scan(&s.ID, &s.BusinessID, &s.LocationID,  &s.Name, &s.DurationMin, &s.PriceCents, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return &s, nil
}

func (r *serviceRepository) Update(ctx context.Context, s *domain.Service) error {
	s.UpdatedAt = time.Now()

	_, err := r.db.Exec(ctx,
		`UPDATE services 
		 SET location_id = $2, name = $4, duration_min = $5, price_cents = $6, updated_at = $7
		 WHERE id = $1`,
		s.ID, s.LocationID, s.Name, s.DurationMin, s.PriceCents, s.UpdatedAt)

	return err
}

func (r *serviceRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM services WHERE id = $1`, id)
	return err
}
