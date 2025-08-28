package usecase

import (
	"context"

	"github.com/ialekseychuk/my-place/internal/domain"
)

type LocationService struct {
	locationRepo domain.LocationRepository
}

func NewLocationService(locationRepo domain.LocationRepository) *LocationService {
	return &LocationService{
		locationRepo: locationRepo,
	}
}

func (s *LocationService) CreateLocation(ctx context.Context, businessID string, location *domain.Location) error {
	location.BusinessID = businessID
	return s.locationRepo.CreateLocation(ctx, location)
}

func (s *LocationService) GetLocationByID(ctx context.Context, id string) (*domain.Location, error) {
	return s.locationRepo.GetByID(ctx, id)
}

func (s *LocationService) GetLocationsByBusinessID(ctx context.Context, businessID string) ([]*domain.Location, error) {
	return s.locationRepo.GetByBusinessID(ctx, businessID)
}

func (s *LocationService) UpdateLocation(ctx context.Context, location *domain.Location) error {
	return s.locationRepo.UpdateLocation(ctx, location)
}

func (s *LocationService) DeleteLocation(ctx context.Context, id string) error {
	return s.locationRepo.Delete(ctx, id)
}
