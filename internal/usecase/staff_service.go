package usecase

import (
	"context"

	"github.com/ialekseychuk/my-place/internal/domain"
)

type StaffService struct {
	repo domain.StaffRepository
}

func NewStaffUseCase(repo domain.StaffRepository) *StaffService {
	return &StaffService{
		repo: repo,
	}
}

func (s *StaffService) CreateStaff(ctx context.Context, staff *domain.Staff) error {
	return s.repo.Create(ctx, staff)
}

func (s *StaffService) ListByBusinessId(ctx context.Context, businessId string) ([]domain.Staff, error) {
	return s.repo.ListByBusinessId(ctx, businessId)
}