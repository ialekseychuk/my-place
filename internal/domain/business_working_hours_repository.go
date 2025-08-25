package domain

import "context"

type BusinessWorkingHoursRepository interface {
	Create(ctx context.Context, workingHours *BusinessWorkingHours) error
	GetByBusinessID(ctx context.Context, businessID string) ([]*BusinessWorkingHours, error)
	Update(ctx context.Context, workingHours *BusinessWorkingHours) error
	DeleteByBusinessID(ctx context.Context, businessID string) error
	CreateBatch(ctx context.Context, workingHours []*BusinessWorkingHours) error
}
