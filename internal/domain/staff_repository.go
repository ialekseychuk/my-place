package domain

import (
	"context"
)

type StaffRepository interface {
	Create(ctx context.Context, s *Staff) error
	Update(ctx context.Context, s *Staff) error
	GetById(ctx context.Context, id string) (*Staff, error)
	ListByBusinessId(ctx context.Context, businessId, locationId string) ([]Staff, error)
}
