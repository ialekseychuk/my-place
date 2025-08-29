package usecase

import (
	"context"
	"errors"

	"github.com/ialekseychuk/my-place/internal/domain"
)

type StaffService struct {
	repo             domain.StaffRepository
	staffServiceRepo domain.StaffServiceRepository
	serviceRepo      domain.ServiceRepository
}

func NewStaffUseCase(repo domain.StaffRepository, staffServiceRepo domain.StaffServiceRepository, serviceRepo domain.ServiceRepository) *StaffService {
	return &StaffService{
		repo:             repo,
		staffServiceRepo: staffServiceRepo,
		serviceRepo:      serviceRepo,
	}
}

func (s *StaffService) CreateStaff(ctx context.Context, staff *domain.Staff) error {
	return s.repo.Create(ctx, staff)
}

func (s *StaffService) ListByBusinessId(ctx context.Context, businessId, locationId string) ([]domain.Staff, error) {
	return s.repo.ListByBusinessId(ctx, businessId, locationId)
}

func (s *StaffService) GetById(ctx context.Context, id string) (*domain.Staff, error) {
	return s.repo.GetById(ctx, id)
}

func (s *StaffService) UpdateStaff(ctx context.Context, staff *domain.Staff) error {
	return s.repo.Update(ctx, staff)
}

func (s *StaffService) AssignServiceToStaff(ctx context.Context, staffID, serviceID string) error {
	staff, err := s.repo.GetById(ctx, staffID)
	if err != nil {
		return err
	}

	service, err := s.serviceRepo.GetById(ctx, serviceID)
	if err != nil {
		return err
	}

	if staff.BusinessID != service.BusinessID {
		return errors.New("staff and service must belong to the same business")
	}

	return s.staffServiceRepo.AssignServiceToStaff(ctx, staffID, serviceID)
}

func (s *StaffService) UnassignServiceFromStaff(ctx context.Context, staffID, serviceID string) error {
	return s.staffServiceRepo.UnassignServiceFromStaff(ctx, staffID, serviceID)
}

func (s *StaffService) GetStaffServices(ctx context.Context, staffID string) ([]domain.Service, error) {
	return s.staffServiceRepo.GetStaffServices(ctx, staffID)
}

func (s *StaffService) GetServiceStaff(ctx context.Context, serviceID string) ([]domain.Staff, error) {
	return s.staffServiceRepo.GetServiceStaff(ctx, serviceID)
}

func (s *StaffService) GetStaffServicesByBusiness(ctx context.Context, businessID string) ([]domain.StaffServiceWithDetails, error) {
	return s.staffServiceRepo.GetStaffServicesByBusiness(ctx, businessID)
}

func (s *StaffService) AssignMultipleServicesToStaff(ctx context.Context, staffID string, serviceIDs []string) error {
	staff, err := s.repo.GetById(ctx, staffID)
	if err != nil {
		return err
	}

	for _, serviceID := range serviceIDs {
		service, err := s.serviceRepo.GetById(ctx, serviceID)
		if err != nil {
			return err
		}
		if staff.BusinessID != service.BusinessID {
			return errors.New("all services must belong to the same business as the staff member")
		}
	}

	return s.staffServiceRepo.AssignMultipleServicesToStaff(ctx, staffID, serviceIDs)
}

func (s *StaffService) ReplaceStaffServices(ctx context.Context, staffID string, serviceIDs []string) error {
	staff, err := s.repo.GetById(ctx, staffID)
	if err != nil {
		return err
	}

	for _, serviceID := range serviceIDs {
		service, err := s.serviceRepo.GetById(ctx, serviceID)
		if err != nil {
			return err
		}
		if staff.BusinessID != service.BusinessID {
			return errors.New("all services must belong to the same business as the staff member")
		}
	}

	return s.staffServiceRepo.ReplaceStaffServices(ctx, staffID, serviceIDs)
}
