package domain

import "context"

type StaffServiceRepository interface {
	AssignServiceToStaff(ctx context.Context, staffID, serviceID string) error
	UnassignServiceFromStaff(ctx context.Context, staffID, serviceID string) error
	GetStaffServices(ctx context.Context, staffID string) ([]Service, error)
	GetServiceStaff(ctx context.Context, serviceID string) ([]Staff, error)
	GetStaffServicesByBusiness(ctx context.Context, businessID string) ([]StaffServiceWithDetails, error)
	IsServiceAssignedToStaff(ctx context.Context, staffID, serviceID string) (bool, error)
	AssignMultipleServicesToStaff(ctx context.Context, staffID string, serviceIDs []string) error
	ReplaceStaffServices(ctx context.Context, staffID string, serviceIDs []string) error
}
