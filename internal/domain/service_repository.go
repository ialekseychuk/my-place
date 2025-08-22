package domain

import "context"

type ServiceRepository interface {
	Create(ctx context.Context, s *Service) (error)
	ListByBusinessId(ctx context.Context, businessId string) ([]Service, error)
}