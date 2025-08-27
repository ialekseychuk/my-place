package usecase

import "github.com/ialekseychuk/my-place/internal/domain"

type ClientService struct {
	userRepo domain.ClientRepository
}