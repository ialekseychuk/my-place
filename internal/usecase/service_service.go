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

// Service methods
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

// Category methods
func (s *ServiceService) CreateCategory(ctx context.Context, category *domain.ServiceCategory) error {
	return s.repo.CreateCategory(ctx, category)
}

func (s *ServiceService) GetCategoryById(ctx context.Context, id string) (*domain.ServiceCategory, error) {
	return s.repo.GetCategoryById(ctx, id)
}

func (s *ServiceService) ListCategoriesByBusinessId(ctx context.Context, businessId string) ([]domain.ServiceCategory, error) {
	return s.repo.ListCategoriesByBusinessId(ctx, businessId)
}

func (s *ServiceService) UpdateCategory(ctx context.Context, category *domain.ServiceCategory) error {
	return s.repo.UpdateCategory(ctx, category)
}

func (s *ServiceService) DeleteCategory(ctx context.Context, id string) error {
	return s.repo.DeleteCategory(ctx, id)
}

// Services by category
func (s *ServiceService) ListServicesByCategoryId(ctx context.Context, categoryId string) ([]domain.Service, error) {
	return s.repo.ListServicesByCategoryId(ctx, categoryId)
}

// Order management
func (s *ServiceService) UpdateServiceOrder(ctx context.Context, serviceIds []string) error {
	return s.repo.UpdateServiceOrder(ctx, serviceIds)
}

func (s *ServiceService) UpdateCategoryOrder(ctx context.Context, categoryIds []string) error {
	return s.repo.UpdateCategoryOrder(ctx, categoryIds)
}

// Get business services with categories
func (s *ServiceService) GetBusinessServicesWithCategories(ctx context.Context, businessId string) (map[string][]domain.Service, error) {
	categories, err := s.repo.ListCategoriesByBusinessId(ctx, businessId)
	if err != nil {
		return nil, err
	}

	result := make(map[string][]domain.Service)

	// Get services without categories
	services, err := s.repo.ListByBusinessId(ctx, businessId)
	if err != nil {
		return nil, err
	}

	// Filter services without categories
	var uncategorizedServices []domain.Service
	for _, service := range services {
		if service.CategoryID == "" {
			uncategorizedServices = append(uncategorizedServices, service)
		}
	}

	// Add uncategorized services
	if len(uncategorizedServices) > 0 {
		result[""] = uncategorizedServices
	}

	// Get services for each category
	for _, category := range categories {
		categoryServices, err := s.repo.ListServicesByCategoryId(ctx, category.ID)
		if err != nil {
			return nil, err
		}
		result[category.ID] = categoryServices
	}

	return result, nil
}
