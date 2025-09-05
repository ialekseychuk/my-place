package repository

import (
	"context"
	"time"

	"github.com/ialekseychuk/my-place/internal/domain"
	rawsql "github.com/ialekseychuk/my-place/pkg/raw_sql"
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

// Service methods
func (r *serviceRepository) Create(ctx context.Context, s *domain.Service) error {
	err := r.db.QueryRow(ctx,
		`INSERT INTO services 
	(business_id, location_id, name, duration_min, price_cents, category_id, order_index)
	 VALUES ($1,$2,$3,$4,$5,$6,$7)
	 RETURNING id`,
		s.BusinessID, s.LocationID, s.Name, s.DurationMin, s.PriceCents, s.CategoryID, s.OrderIndex,
	).Scan(&s.ID)

	return err
}

func (r *serviceRepository) ListByBusinessId(ctx context.Context, businessId string) ([]domain.Service, error) {
	var services []domain.Service
	rows, _ := r.db.Query(ctx,
		`SELECT id, business_id, location_id, name, duration_min, price_cents, category_id, order_index, created_at, updated_at
		 FROM services
		 WHERE business_id = $1
		 ORDER BY category_id NULLS FIRST, order_index ASC`,
		businessId,
	)
	for rows.Next() {
		var s domain.Service
		rows.Scan(&s.ID, &s.BusinessID, &s.LocationID, &s.Name, &s.DurationMin, &s.PriceCents,
			&s.CategoryID, &s.OrderIndex, &s.CreatedAt, &s.UpdatedAt)
		services = append(services, s)
	}

	return services, rows.Err()
}

func (r *serviceRepository) GetById(ctx context.Context, id string) (*domain.Service, error) {
	var s domain.Service
	sql := `SELECT id, business_id, location_id, name, duration_min, price_cents, category_id, order_index, created_at, updated_at
	 FROM services
	 WHERE id = $1`

	 args := []interface{}{}
	 args = append(args, id)
	 t := rawsql.BuildSQL(sql, args)
	 _ = t
	 
	err := r.db.QueryRow(ctx,sql,id).
	Scan(&s.ID, &s.BusinessID, &s.LocationID, &s.Name, &s.DurationMin, &s.PriceCents,
		&s.CategoryID, &s.OrderIndex, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return &s, nil
}

func (r *serviceRepository) Update(ctx context.Context, s *domain.Service) error {
	s.UpdatedAt = time.Now()

	_, err := r.db.Exec(ctx,
		`UPDATE services 
		 SET location_id = $2, name = $3, duration_min = $4, price_cents = $5, 
		     category_id = $6, order_index = $7, updated_at = $8
		 WHERE id = $1`,
		s.ID, s.LocationID, s.Name, s.DurationMin, s.PriceCents,
		s.CategoryID, s.OrderIndex, s.UpdatedAt)

	return err
}

func (r *serviceRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM services WHERE id = $1`, id)
	return err
}

// Category methods
func (r *serviceRepository) CreateCategory(ctx context.Context, category *domain.ServiceCategory) error {
	err := r.db.QueryRow(ctx,
		`INSERT INTO service_categories 
		(business_id, name, order_index)
		VALUES ($1, $2, $3)
		RETURNING id, created_at, updated_at`,
		category.BusinessID, category.Name, category.OrderIndex,
	).Scan(&category.ID, &category.CreatedAt, &category.UpdatedAt)

	return err
}

func (r *serviceRepository) GetCategoryById(ctx context.Context, id string) (*domain.ServiceCategory, error) {
	var category domain.ServiceCategory
	err := r.db.QueryRow(ctx,
		`SELECT id, business_id, name, order_index, created_at, updated_at
		FROM service_categories
		WHERE id = $1`,
		id,
	).Scan(&category.ID, &category.BusinessID, &category.Name, &category.OrderIndex,
		&category.CreatedAt, &category.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return &category, nil
}

func (r *serviceRepository) ListCategoriesByBusinessId(ctx context.Context, businessId string) ([]domain.ServiceCategory, error) {
	var categories []domain.ServiceCategory
	rows, _ := r.db.Query(ctx,
		`SELECT id, business_id, name, order_index, created_at, updated_at
		FROM service_categories
		WHERE business_id = $1
		ORDER BY order_index ASC`,
		businessId,
	)
	defer rows.Close()

	for rows.Next() {
		var category domain.ServiceCategory
		rows.Scan(&category.ID, &category.BusinessID, &category.Name, &category.OrderIndex,
			&category.CreatedAt, &category.UpdatedAt)
		categories = append(categories, category)
	}

	return categories, rows.Err()
}

func (r *serviceRepository) UpdateCategory(ctx context.Context, category *domain.ServiceCategory) error {
	category.UpdatedAt = time.Now()

	_, err := r.db.Exec(ctx,
		`UPDATE service_categories 
		SET name = $2, order_index = $3, updated_at = $4
		WHERE id = $1`,
		category.ID, category.Name, category.OrderIndex, category.UpdatedAt,
	)

	return err
}

func (r *serviceRepository) DeleteCategory(ctx context.Context, id string) error {
	// Note: This will set category_id to NULL for all services in this category
	// due to the ON DELETE SET NULL constraint
	_, err := r.db.Exec(ctx, `DELETE FROM service_categories WHERE id = $1`, id)
	return err
}

// Services by category
func (r *serviceRepository) ListServicesByCategoryId(ctx context.Context, categoryId string) ([]domain.Service, error) {
	var services []domain.Service
	rows, _ := r.db.Query(ctx,
		`SELECT id, business_id, location_id, name, duration_min, price_cents, category_id, order_index, created_at, updated_at
		FROM services
		WHERE category_id = $1
		ORDER BY order_index ASC`,
		categoryId,
	)
	defer rows.Close()

	for rows.Next() {
		var s domain.Service
		rows.Scan(&s.ID, &s.BusinessID, &s.LocationID, &s.Name, &s.DurationMin, &s.PriceCents,
			&s.CategoryID, &s.OrderIndex, &s.CreatedAt, &s.UpdatedAt)
		services = append(services, s)
	}

	return services, rows.Err()
}

// Order management
func (r *serviceRepository) UpdateServiceOrder(ctx context.Context, serviceIds []string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Update order_index for each service based on its position in the array
	for i, id := range serviceIds {
		_, err := tx.Exec(ctx,
			`UPDATE services SET order_index = $1, updated_at = $2 WHERE id = $3`,
			i, time.Now(), id)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *serviceRepository) UpdateCategoryOrder(ctx context.Context, categoryIds []string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Update order_index for each category based on its position in the array
	for i, id := range categoryIds {
		_, err := tx.Exec(ctx,
			`UPDATE service_categories SET order_index = $1, updated_at = $2 WHERE id = $3`,
			i, time.Now(), id)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}
