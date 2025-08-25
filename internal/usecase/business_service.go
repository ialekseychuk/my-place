package usecase

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"

	"golang.org/x/crypto/bcrypt"

	"github.com/ialekseychuk/my-place/internal/domain"
	"github.com/ialekseychuk/my-place/internal/dto"
)

type BusinessUseCase struct {
	businessRepo     domain.BusinessRepository
	userRepo         domain.UserRepository
	workingHoursRepo domain.BusinessWorkingHoursRepository
}

func NewBusinessUseCase(
	businessRepo domain.BusinessRepository,
	userRepo domain.UserRepository,
	workingHoursRepo domain.BusinessWorkingHoursRepository,
) *BusinessUseCase {
	return &BusinessUseCase{
		businessRepo:     businessRepo,
		userRepo:         userRepo,
		workingHoursRepo: workingHoursRepo,
	}
}

// CreateBusiness creates a new business (legacy method for backward compatibility)
func (uc *BusinessUseCase) CreateBusiness(ctx context.Context, name, tz string) (*domain.Business, error) {
	b := &domain.Business{
		Name:     name,
		Timezone: tz,
	}
	if err := uc.businessRepo.Create(ctx, b); err != nil {
		return nil, err
	}
	return b, nil
}

// RegisterBusiness creates a new business with owner and working hours
func (uc *BusinessUseCase) RegisterBusiness(ctx context.Context, req dto.CreateBusinessRequest) (*dto.CreateBusinessResponse, error) {
	// Generate unique IDs
	businessID := generateID()
	userID := generateID()

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.OwnerPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create business
	business := &domain.Business{
		ID:                       businessID,
		Name:                     req.BusinessName,
		BusinessType:             req.BusinessType,
		Description:              req.Description,
		Address:                  req.Address,
		City:                     req.City,
		Phone:                    req.Phone,
		Email:                    req.Email,
		Website:                  req.Website,
		Timezone:                 req.Timezone,
		Currency:                 req.Currency,
		EnableOnlineBooking:      req.EnableOnlineBooking,
		EnableSMSNotifications:   req.EnableSMSNotifications,
		EnableEmailNotifications: req.EnableEmailNotifications,
	}

	if err := uc.businessRepo.Create(ctx, business); err != nil {
		return nil, fmt.Errorf("failed to create business: %w", err)
	}

	// Create owner user
	owner := &domain.User{
		ID:         userID,
		BusinessID: businessID,
		FirstName:  req.OwnerFirstName,
		LastName:   req.OwnerLastName,
		Email:      req.OwnerEmail,
		Phone:      req.OwnerPhone,
		Password:   string(hashedPassword),
		Role:       "owner",
		IsActive:   true,
	}

	if err := uc.userRepo.Create(ctx, owner); err != nil {
		return nil, fmt.Errorf("failed to create owner: %w", err)
	}

	// Create working hours
	workingHours := uc.convertWorkingHours(businessID, req.WorkingHours)
	if err := uc.workingHoursRepo.CreateBatch(ctx, workingHours); err != nil {
		return nil, fmt.Errorf("failed to create working hours: %w", err)
	}

	return &dto.CreateBusinessResponse{
		BusinessID: businessID,
		UserID:     userID,
		Message:    "Business registration successful",
	}, nil
}

func (uc *BusinessUseCase) GetById(ctx context.Context, id string) (*domain.Business, error) {
	return uc.businessRepo.GetById(ctx, id)
}

// convertWorkingHours converts DTO working hours to domain working hours
func (uc *BusinessUseCase) convertWorkingHours(businessID string, hours dto.WorkingHoursWeekDTO) []*domain.BusinessWorkingHours {
	workingHours := []*domain.BusinessWorkingHours{}
	dayMap := map[string]int{
		"sunday":    0,
		"monday":    1,
		"tuesday":   2,
		"wednesday": 3,
		"thursday":  4,
		"friday":    5,
		"saturday":  6,
	}

	dayHours := map[string]dto.WorkingHoursDTO{
		"sunday":    hours.Sunday,
		"monday":    hours.Monday,
		"tuesday":   hours.Tuesday,
		"wednesday": hours.Wednesday,
		"thursday":  hours.Thursday,
		"friday":    hours.Friday,
		"saturday":  hours.Saturday,
	}

	for dayName, dayNum := range dayMap {
		hour := dayHours[dayName]
		workingHour := &domain.BusinessWorkingHours{
			ID:         generateID(),
			BusinessID: businessID,
			DayOfWeek:  dayNum,
			StartTime:  hour.Start,
			EndTime:    hour.End,
			IsEnabled:  hour.Enabled,
		}
		workingHours = append(workingHours, workingHour)
	}

	return workingHours
}

// generateID generates a random unique ID
func generateID() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
