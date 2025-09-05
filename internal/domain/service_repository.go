package domain

import "context"

type ServiceRepository interface {
	Create(ctx context.Context, s *Service) error
	GetById(ctx context.Context, id string) (*Service, error)
	ListByBusinessId(ctx context.Context, businessId string) ([]Service, error)
	Update(ctx context.Context, s *Service) error
	Delete(ctx context.Context, id string) error

	// Category methods
	CreateCategory(ctx context.Context, category *ServiceCategory) error
	GetCategoryById(ctx context.Context, id string) (*ServiceCategory, error)
	ListCategoriesByBusinessId(ctx context.Context, businessId string) ([]ServiceCategory, error)
	UpdateCategory(ctx context.Context, category *ServiceCategory) error
	DeleteCategory(ctx context.Context, id string) error

	// Service with categories
	ListServicesByCategoryId(ctx context.Context, categoryId string) ([]Service, error)
	UpdateServiceOrder(ctx context.Context, serviceIds []string) error
	UpdateCategoryOrder(ctx context.Context, categoryIds []string) error
}
