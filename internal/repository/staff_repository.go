package repository

import (
	"context"
	"time"

	"github.com/ialekseychuk/my-place/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)


type staffRepository struct {
	db *pgxpool.Pool
}

func NewStaffRepository(db *pgxpool.Pool) *staffRepository {
	return &staffRepository{
		db: db,
	}
}

func (r *staffRepository) Create(ctx context.Context, s *domain.Staff) (error) {
	s.CreatedAt = time.Now()
	s.UpdatedAt = time.Now()

	err := r.db.QueryRow(ctx,
	`INSERT INTO staff 
	(business_id, full_name, created_at, updated_at)
	 VALUES ($1,$2,$3,$4)
	 RETURNING id`,
	s.BusinessID, s.FullName, s.CreatedAt, s.UpdatedAt,
	).Scan(&s.ID)

	return err
}


func (r *staffRepository) ListByBusinessId(ctx context.Context, businessId string) ([]domain.Staff, error) {
	var staff []domain.Staff
	rows, _ := r.db.Query(ctx,
		`SELECT id, business_id, full_name, created_at, updated_at
		 FROM staff
		 WHERE business_id = $1`,
		businessId,
	)
	for rows.Next() {
		var s domain.Staff
		rows.Scan(&s.ID, &s.BusinessID, &s.FullName, &s.CreatedAt, &s.UpdatedAt)
		staff = append(staff, s)
	}

	return staff, rows.Err()
}

func (r *staffRepository) GetById(ctx context.Context, id string) (*domain.Staff, error) {
	var s domain.Staff
	err := r.db.QueryRow(ctx,
	`SELECT id, business_id, full_name, created_at, updated_at
	 FROM staff
	 WHERE id = $1`,
	id).Scan(&s.ID, &s.BusinessID, &s.FullName, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	
	return &s, nil
}