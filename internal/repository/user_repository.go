package repository

import (
	"context"
	"time"

	"github.com/ialekseychuk/my-place/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type userRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) domain.UserRepository {
	return &userRepository{
		db: db,
	}
}

func (r *userRepository) Create(ctx context.Context, user *domain.User) error {
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()

	_, err := r.db.Exec(ctx,
		`INSERT INTO users (id, business_id, first_name, last_name, email, phone, password, role, is_active, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
		user.ID, user.BusinessID, user.FirstName, user.LastName, user.Email, user.Phone,
		user.Password, user.Role, user.IsActive, user.CreatedAt, user.UpdatedAt)
	return err
}

func (r *userRepository) GetById(ctx context.Context, id string) (*domain.User, error) {
	var user domain.User
	err := r.db.QueryRow(ctx,
		`SELECT id, business_id, first_name, last_name, email, phone, password, role, is_active, created_at, updated_at
		 FROM users
		 WHERE id = $1`,
		id).Scan(&user.ID, &user.BusinessID, &user.FirstName, &user.LastName, &user.Email,
		&user.Phone, &user.Password, &user.Role, &user.IsActive, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	var user domain.User
	err := r.db.QueryRow(ctx,
		`SELECT id, business_id, first_name, last_name, email, phone, password, role, is_active, created_at, updated_at
		 FROM users
		 WHERE email = $1`,
		email).Scan(&user.ID, &user.BusinessID, &user.FirstName, &user.LastName, &user.Email,
		&user.Phone, &user.Password, &user.Role, &user.IsActive, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetByBusinessID(ctx context.Context, businessID string) ([]*domain.User, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, business_id, first_name, last_name, email, phone, password, role, is_active, created_at, updated_at
		 FROM users
		 WHERE business_id = $1
		 ORDER BY created_at DESC`,
		businessID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*domain.User
	for rows.Next() {
		var user domain.User
		err := rows.Scan(&user.ID, &user.BusinessID, &user.FirstName, &user.LastName, &user.Email,
			&user.Phone, &user.Password, &user.Role, &user.IsActive, &user.CreatedAt, &user.UpdatedAt)
		if err != nil {
			return nil, err
		}
		users = append(users, &user)
	}
	return users, nil
}

func (r *userRepository) Update(ctx context.Context, user *domain.User) error {
	user.UpdatedAt = time.Now()

	_, err := r.db.Exec(ctx,
		`UPDATE users 
		 SET first_name = $2, last_name = $3, email = $4, phone = $5, role = $6, is_active = $7, updated_at = $8
		 WHERE id = $1`,
		user.ID, user.FirstName, user.LastName, user.Email, user.Phone, user.Role, user.IsActive, user.UpdatedAt)
	return err
}

func (r *userRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, "DELETE FROM users WHERE id = $1", id)
	return err
}
