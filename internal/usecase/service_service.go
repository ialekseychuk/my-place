package usecase

import (
	"context"

	"github.com/ialekseychuk/my-place/internal/domain"
)

type ServiceService struct {
	repo domain.ServiceRepository
}


func NewServiceUseCase(repo domain.ServiceRepository) *ServiceService {
	return &ServiceService{
		repo: repo,
	}
}

func (s *ServiceService) CreateService(ctx context.Context, service *domain.Service) error {
	return s.repo.Create(ctx, service)
}

func (s *ServiceService) ListByBusinessId(ctx context.Context, businessId string) ([]domain.Service, error) {
	return s.repo.ListByBusinessId(ctx, businessId)
}

