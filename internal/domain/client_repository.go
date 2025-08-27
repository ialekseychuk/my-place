package domain

import "context"

type ClientRepository interface {
	CreateClient(ctx context.Context, client *Client) error
	GetClientByID(ctx context.Context, clientID string) (*Client, error)
	GetClientByPhone(ctx context.Context, businessID, phone string) (*Client, error)
	UpdateClient(ctx context.Context, client *Client) error
	DeleteClient(ctx context.Context, clientID string) error
}