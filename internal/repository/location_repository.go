package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/ialekseychuk/my-place/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type LocationRepository struct {
	db *pgxpool.Pool
}

func NewLocationRepository(db *pgxpool.Pool) *LocationRepository {
	return &LocationRepository{db: db}
}


func (r *LocationRepository) CreateLocation(ctx context.Context, location *domain.Location) error {
	

	err := r.db.QueryRow(ctx, 
		`INSERT INTO locations (business_id, name, address, city, contact_info, timezone)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at`,
		location.BusinessID,
		location.Name,
		location.Address,
		location.City,
		location.ContactInfo,
		location.Timezone,
	).Scan(&location.ID, &location.CreatedAt, &location.UpdatedAt)

	return err
}

func (r *LocationRepository) GetByID(ctx context.Context, id string) (*domain.Location, error) {

	var location domain.Location
	err := r.db.QueryRow(ctx, 
		`SELECT id, business_id, name, address, city, contact_info, timezone, created_at, updated_at
		FROM locations
		WHERE id = $1`, id).Scan(
		&location.ID,
		&location.BusinessID,
		&location.Name,
		&location.Address,
		&location.City,
		&location.ContactInfo,
		&location.Timezone,
		&location.CreatedAt,
		&location.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &location, nil
}

func (r *LocationRepository) GetByBusinessID(ctx context.Context, businessID string) ([]*domain.Location, error) {
	rows, err := r.db.Query(ctx, 
		`SELECT id, business_id, name, address, city, contact_info, timezone, created_at, updated_at
		FROM locations
		WHERE business_id = $1
		ORDER BY name`, businessID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var locations []*domain.Location
	for rows.Next() {
		var location domain.Location
		err := rows.Scan(
			&location.ID,
			&location.BusinessID,
			&location.Name,
			&location.Address,
			&location.City,
			&location.ContactInfo,
			&location.Timezone,
			&location.CreatedAt,
			&location.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		locations = append(locations, &location)
	}

	return locations, rows.Err()
}

func (r *LocationRepository) UpdateLocation(ctx context.Context, location *domain.Location) error {
	// Validate that required fields are not empty
	if location.Name == "" {
		return fmt.Errorf("location name cannot be empty")
	}
	
	now := time.Now()
	err := r.db.QueryRow(ctx, `
		UPDATE locations
		SET name = $1, address = $2, city = $3, contact_info = $4, timezone = $5, updated_at = $6
		WHERE id = $7
		RETURNING updated_at`,
		location.Name,
		location.Address,
		location.City,
		location.ContactInfo,
		location.Timezone,
		now,
		location.ID,
	).Scan(&location.UpdatedAt)

	return err
}

func (r *LocationRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM locations WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}
