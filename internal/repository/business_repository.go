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
	`SELECT id, name, timezone, created_at, updated_at
	 FROM businesses
	 WHERE id = $1`,
	id).Scan(&b.ID, &b.Name, &b.Timezone, &b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		return nil, err
	}
	
	return &b, nil
}

func (r *businessRepository) Create(ctx context.Context, b *domain.Business) (error) {
	b.CreatedAt = time.Now()
	b.UpdatedAt = time.Now()

	err := r.db.QueryRow(ctx,
	`INSERT INTO businesses (name, timezone, created_at, updated_at)
	 VALUES ($1,$2,$3,$4)
	 RETURNING id`,
	b.Name, b.Timezone, b.CreatedAt, b.UpdatedAt).Scan(&b.ID)
	return err
}

