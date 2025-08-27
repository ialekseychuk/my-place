package repository

import (
	"context"
	"time"

	"github.com/ialekseychuk/my-place/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type clientRepository struct {
	db *pgxpool.Pool
}

func NewClientRepository(db *pgxpool.Pool) domain.ClientRepository {
	return &clientRepository{
		db: db,
	}
}

func (r *clientRepository) CreateClient(ctx context.Context, client *domain.Client) error {
	client.CreatedAt = time.Now()
	client.UpdatedAt = time.Now()

	err := r.db.QueryRow(ctx,
		`INSERT INTO clients (business_id, first_name, last_name, email, phone, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id`,
		client.BusinessID, client.FirstName, client.LastName, client.Email, client.Phone,
		client.CreatedAt, client.UpdatedAt).Scan(&client.ID)
	return err
}

func (r *clientRepository) GetClientByID(ctx context.Context, clientID string) (*domain.Client, error) {
	var client domain.Client
	err := r.db.QueryRow(ctx,
		`SELECT id, business_id, first_name, last_name, email, phone, created_at, updated_at
		 FROM clients
		 WHERE id = $1`,
		clientID).Scan(&client.ID, &client.BusinessID, &client.FirstName, &client.LastName,
		&client.Email, &client.Phone, &client.CreatedAt, &client.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &client, nil
}

func (r *clientRepository) GetClientByPhone(ctx context.Context, businessID, phone string) (*domain.Client, error) {
	var client domain.Client
	err := r.db.QueryRow(ctx,
		`SELECT id, business_id, first_name, last_name, email, phone, created_at, updated_at
		 FROM clients
		 WHERE business_id = $1 AND phone = $2`,
		businessID, phone).Scan(&client.ID, &client.BusinessID, &client.FirstName, &client.LastName,
		&client.Email, &client.Phone, &client.CreatedAt, &client.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &client, nil
}

func (r *clientRepository) UpdateClient(ctx context.Context, client *domain.Client) error {
	client.UpdatedAt = time.Now()
	
	err := r.db.QueryRow(ctx,
		`UPDATE clients 
		 SET business_id = $1, first_name = $2, last_name = $3, email = $4, phone = $5, updated_at = $6
		 WHERE id = $7
		 RETURNING id`,
		client.BusinessID, client.FirstName, client.LastName, client.Email, client.Phone,
		client.UpdatedAt, client.ID).Scan(&client.ID)
	return err
}

func (r *clientRepository) DeleteClient(ctx context.Context, clientID string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM clients WHERE id = $1`, clientID)
	return err
}