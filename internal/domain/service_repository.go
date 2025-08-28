package domain

import "context"

type ServiceRepository interface {
	Create(ctx context.Context, s *Service) error
	GetById(ctx context.Context, id string) (*Service, error)
	ListByBusinessId(ctx context.Context, businessId string) ([]Service, error)
	Update(ctx context.Context, s *Service) error
	Delete(ctx context.Context, id string) error
}
