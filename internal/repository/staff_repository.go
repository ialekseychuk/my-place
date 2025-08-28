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

func (r *staffRepository) Create(ctx context.Context, s *domain.Staff) error {
	s.IsActive = true

	err := r.db.QueryRow(ctx,
		`INSERT INTO staff 
	(business_id, location_id, first_name, last_name, phone, gender, position, description, specialization, is_active)
	 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
	 RETURNING id, created_at, updated_at`,
		s.BusinessID, s.LocationID, s.FirstName, s.LastName, s.Phone, s.Gender, s.Position, s.Description, s.Specialization, s.IsActive,
	).Scan(&s.ID, &s.CreatedAt, &s.UpdatedAt)

	return err
}

func (r *staffRepository) ListByBusinessId(ctx context.Context, businessId string) ([]domain.Staff, error) {
	var staff []domain.Staff
	rows, err := r.db.Query(ctx,
		`SELECT id, business_id, location_id, first_name, last_name, phone, gender, position, description, specialization, is_active, created_at, updated_at
		 FROM staff
		 WHERE business_id = $1 AND is_active = true
		 ORDER BY first_name, last_name`,
		businessId,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var s domain.Staff
		err := rows.Scan(&s.ID, &s.BusinessID, &s.LocationID, &s.FirstName, &s.LastName, &s.Phone, &s.Gender, &s.Position, &s.Description, &s.Specialization, &s.IsActive, &s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			return nil, err
		}
		staff = append(staff, s)
	}

	return staff, rows.Err()
}

func (r *staffRepository) GetById(ctx context.Context, id string) (*domain.Staff, error) {
	var s domain.Staff
	err := r.db.QueryRow(ctx,
		`SELECT id, business_id, location_id, first_name, last_name, phone, gender, position, description, specialization, is_active, created_at, updated_at
	 FROM staff
	 WHERE id = $1`,
		id).Scan(&s.ID, &s.BusinessID, &s.LocationID, &s.FirstName, &s.LastName, &s.Phone, &s.Gender, &s.Position, &s.Description, &s.Specialization, &s.IsActive, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return &s, nil
}

func (r *staffRepository) Update(ctx context.Context, s *domain.Staff) error {
	s.UpdatedAt = time.Now()

	_, err := r.db.Exec(ctx,
		`UPDATE staff 
		 SET first_name = $2, last_name = $3, phone = $4, gender = $5, position = $6, 
		     description = $7, specialization = $8, is_active = $9, location_id = $10, updated_at = $11
		 WHERE id = $1`,
		s.ID, s.FirstName, s.LastName, s.Phone, s.Gender, s.Position,
		s.Description, s.Specialization, s.IsActive, s.LocationID, s.UpdatedAt)

	return err
}
