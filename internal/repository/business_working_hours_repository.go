package repository

import (
	"context"
	"time"

	"github.com/ialekseychuk/my-place/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type businessWorkingHoursRepository struct {
	db *pgxpool.Pool
}

func NewBusinessWorkingHoursRepository(db *pgxpool.Pool) domain.BusinessWorkingHoursRepository {
	return &businessWorkingHoursRepository{
		db: db,
	}
}

func (r *businessWorkingHoursRepository) Create(ctx context.Context, workingHours *domain.BusinessWorkingHours) error {
	workingHours.CreatedAt = time.Now()
	workingHours.UpdatedAt = time.Now()

	_, err := r.db.Exec(ctx,
		`INSERT INTO business_working_hours (id, business_id, day_of_week, start_time, end_time, is_enabled, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		workingHours.ID, workingHours.BusinessID, workingHours.DayOfWeek, workingHours.StartTime,
		workingHours.EndTime, workingHours.IsEnabled, workingHours.CreatedAt, workingHours.UpdatedAt)
	return err
}

func (r *businessWorkingHoursRepository) GetByBusinessID(ctx context.Context, businessID string) ([]*domain.BusinessWorkingHours, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, business_id, day_of_week, start_time, end_time, is_enabled, created_at, updated_at
		 FROM business_working_hours
		 WHERE business_id = $1
		 ORDER BY day_of_week`,
		businessID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var workingHours []*domain.BusinessWorkingHours
	for rows.Next() {
		var wh domain.BusinessWorkingHours
		err := rows.Scan(&wh.ID, &wh.BusinessID, &wh.DayOfWeek, &wh.StartTime, &wh.EndTime,
			&wh.IsEnabled, &wh.CreatedAt, &wh.UpdatedAt)
		if err != nil {
			return nil, err
		}
		workingHours = append(workingHours, &wh)
	}
	return workingHours, nil
}

func (r *businessWorkingHoursRepository) Update(ctx context.Context, workingHours *domain.BusinessWorkingHours) error {
	workingHours.UpdatedAt = time.Now()

	_, err := r.db.Exec(ctx,
		`UPDATE business_working_hours 
		 SET start_time = $3, end_time = $4, is_enabled = $5, updated_at = $6
		 WHERE business_id = $1 AND day_of_week = $2`,
		workingHours.BusinessID, workingHours.DayOfWeek, workingHours.StartTime,
		workingHours.EndTime, workingHours.IsEnabled, workingHours.UpdatedAt)
	return err
}

func (r *businessWorkingHoursRepository) DeleteByBusinessID(ctx context.Context, businessID string) error {
	_, err := r.db.Exec(ctx, "DELETE FROM business_working_hours WHERE business_id = $1", businessID)
	return err
}

func (r *businessWorkingHoursRepository) CreateBatch(ctx context.Context, workingHours []*domain.BusinessWorkingHours) error {
	if len(workingHours) == 0 {
		return nil
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	for _, wh := range workingHours {
		wh.CreatedAt = time.Now()
		wh.UpdatedAt = time.Now()

		_, err := tx.Exec(ctx,
			`INSERT INTO business_working_hours (id, business_id, day_of_week, start_time, end_time, is_enabled, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
			wh.ID, wh.BusinessID, wh.DayOfWeek, wh.StartTime, wh.EndTime, wh.IsEnabled, wh.CreatedAt, wh.UpdatedAt)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}
