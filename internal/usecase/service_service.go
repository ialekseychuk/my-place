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

func (s *ServiceService) GetServiceById(ctx context.Context, id string) (*domain.Service, error) {
	return s.repo.GetById(ctx, id)
}

func (s *ServiceService) UpdateService(ctx context.Context, service *domain.Service) error {
	return s.repo.Update(ctx, service)
}

func (s *ServiceService) DeleteService(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
