package repository

import (
	"context"
	"time"

	"github.com/ialekseychuk/my-place/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type staffServiceRepository struct {
	db *pgxpool.Pool
}

func NewStaffServiceRepository(db *pgxpool.Pool) domain.StaffServiceRepository {
	return &staffServiceRepository{
		db: db,
	}
}

func (r *staffServiceRepository) AssignServiceToStaff(ctx context.Context, staffID, serviceID string) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO staff_services (staff_id, service_id, created_at, updated_at) 
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT (staff_id, service_id) DO NOTHING`,
		staffID, serviceID, time.Now(), time.Now())
	return err
}

func (r *staffServiceRepository) UnassignServiceFromStaff(ctx context.Context, staffID, serviceID string) error {
	_, err := r.db.Exec(ctx,
		`DELETE FROM staff_services WHERE staff_id = $1 AND service_id = $2`,
		staffID, serviceID)
	return err
}

func (r *staffServiceRepository) GetStaffServices(ctx context.Context, staffID string) ([]domain.Service, error) {
	var services []domain.Service

	rows, err := r.db.Query(ctx,
		`SELECT s.id, s.business_id, s.name, s.duration_min, s.price_cents, s.created_at, s.updated_at
		 FROM services s
		 JOIN staff_services ss ON s.id = ss.service_id
		 WHERE ss.staff_id = $1
		 ORDER BY s.name`,
		staffID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var service domain.Service
		err := rows.Scan(
			&service.ID, &service.BusinessID, &service.Name,
			&service.DurationMin, &service.PriceCents,
			&service.CreatedAt, &service.UpdatedAt)
		if err != nil {
			return nil, err
		}
		services = append(services, service)
	}

	return services, rows.Err()
}

func (r *staffServiceRepository) GetServiceStaff(ctx context.Context, serviceID string) ([]domain.Staff, error) {
	var staff []domain.Staff

	rows, err := r.db.Query(ctx,
		`SELECT st.id, st.business_id, st.first_name, st.last_name, st.phone, st.gender, 
		        st.position, st.description, st.specialization, st.is_active, st.created_at, st.updated_at
		 FROM staff st
		 JOIN staff_services ss ON st.id = ss.staff_id
		 WHERE ss.service_id = $1 AND st.is_active = true
		 ORDER BY st.first_name, st.last_name`,
		serviceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var s domain.Staff
		err := rows.Scan(
			&s.ID, &s.BusinessID, &s.FirstName, &s.LastName,
			&s.Phone, &s.Gender, &s.Position, &s.Description,
			&s.Specialization, &s.IsActive, &s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			return nil, err
		}
		staff = append(staff, s)
	}

	return staff, rows.Err()
}

func (r *staffServiceRepository) GetStaffServicesByBusiness(ctx context.Context, businessID string) ([]domain.StaffServiceWithDetails, error) {
	var staffServices []domain.StaffServiceWithDetails

	rows, err := r.db.Query(ctx,
		`SELECT ss.id, ss.staff_id, ss.service_id, 
		        CONCAT(st.first_name, ' ', st.last_name) as staff_name,
		        s.name as service_name,
		        ss.created_at, ss.updated_at
		 FROM staff_services ss
		 JOIN staff st ON ss.staff_id = st.id
		 JOIN services s ON ss.service_id = s.id
		 WHERE st.business_id = $1 AND st.is_active = true
		 ORDER BY staff_name, service_name`,
		businessID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var ss domain.StaffServiceWithDetails
		err := rows.Scan(
			&ss.ID, &ss.StaffID, &ss.ServiceID,
			&ss.StaffName, &ss.ServiceName,
			&ss.CreatedAt, &ss.UpdatedAt)
		if err != nil {
			return nil, err
		}
		staffServices = append(staffServices, ss)
	}

	return staffServices, rows.Err()
}

func (r *staffServiceRepository) IsServiceAssignedToStaff(ctx context.Context, staffID, serviceID string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM staff_services WHERE staff_id = $1 AND service_id = $2)`,
		staffID, serviceID).Scan(&exists)
	return exists, err
}

func (r *staffServiceRepository) AssignMultipleServicesToStaff(ctx context.Context, staffID string, serviceIDs []string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	for _, serviceID := range serviceIDs {
		_, err := tx.Exec(ctx,
			`INSERT INTO staff_services (staff_id, service_id, created_at, updated_at) 
			 VALUES ($1, $2, $3, $4)
			 ON CONFLICT (staff_id, service_id) DO NOTHING`,
			staffID, serviceID, time.Now(), time.Now())
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *staffServiceRepository) ReplaceStaffServices(ctx context.Context, staffID string, serviceIDs []string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Remove all existing services for this staff member
	_, err = tx.Exec(ctx, `DELETE FROM staff_services WHERE staff_id = $1`, staffID)
	if err != nil {
		return err
	}

	// Add new services
	for _, serviceID := range serviceIDs {
		_, err := tx.Exec(ctx,
			`INSERT INTO staff_services (staff_id, service_id, created_at, updated_at) 
			 VALUES ($1, $2, $3, $4)`,
			staffID, serviceID, time.Now(), time.Now())
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}
