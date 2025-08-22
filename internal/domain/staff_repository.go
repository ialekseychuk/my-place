package domain

import (
	"context"

)

type StaffRepository interface {
	Create(ctx context.Context, s *Staff) (error)
	ListByBusinessId(ctx context.Context, businessId string) ([]Staff, error)
}