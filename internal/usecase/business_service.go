package usecase

import (
	"context"

	"github.com/ialekseychuk/my-place/internal/domain"
)


type BusinessUseCase struct {
	repo domain.BusinessRepository
}

func NewBusinessUseCase(repo domain.BusinessRepository) *BusinessUseCase {
	return &BusinessUseCase{
		repo: repo,
	}
}

func (uc *BusinessUseCase) CreateBusiness(ctx context.Context, name, tz string) (*domain.Business, error) {
	b := &domain.Business{Name: name, Timezone: tz}
	if err := uc.repo.Create(ctx, b); err != nil {
		return nil, err
	}
	return b, nil
}

func (uc *BusinessUseCase) GetById(ctx context.Context, id string) (*domain.Business, error) {
	return uc.repo.GetById(ctx, id)
}