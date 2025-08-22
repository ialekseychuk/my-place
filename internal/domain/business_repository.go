package domain

import "context"

type BusinessRepository interface {
	Create( ctx context.Context, b *Business) (error)
	GetById(ctx context.Context, id string) (*Business, error)
}