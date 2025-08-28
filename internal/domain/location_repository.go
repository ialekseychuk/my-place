package domain

import "context"

type LocationRepository interface {
	GetByID(ctx context.Context, locationID string) (*Location, error)
	CreateLocation(ctx context.Context, location *Location) error
	UpdateLocation(ctx context.Context, location *Location) error
	GetByBusinessID(ctx context.Context, businessID string) ([]*Location, error)
	Delete(ctx context.Context, id string) error
}