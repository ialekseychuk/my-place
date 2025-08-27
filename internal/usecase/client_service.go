package usecase

import (
	"context"
	"fmt"

	"github.com/ialekseychuk/my-place/internal/domain"
	"github.com/ialekseychuk/my-place/internal/dto"
)

type ClientService struct {
	clientRepo domain.ClientRepository
}

func NewClientService(clientRepo domain.ClientRepository) *ClientService {
	return &ClientService{
		clientRepo: clientRepo,
	}
}

func (s *ClientService) GetClients(ctx context.Context, businessID string, page, limit int, search string) (*dto.ClientListResponse, error) {

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	offset := (page - 1) * limit

	clients, total, err := s.clientRepo.GetClientsByBusiness(ctx, businessID, offset, limit, search)
	if err != nil {
		return nil, fmt.Errorf("failed to get clients: %w", err)
	}

	var clientResponses []dto.ClientResponse
	for _, client := range clients {
		clientResponses = append(clientResponses, dto.ClientResponse{
			ID:        client.ID,
			FirstName: client.FirstName,
			LastName:  client.LastName,
			Email:     client.Email,
			Phone:     client.Phone,
			CreatedAt: client.CreatedAt,
			UpdatedAt: client.UpdatedAt,
		})
	}

	pages := total / limit
	if total%limit > 0 {
		pages++
	}

	response := &dto.ClientListResponse{
		Clients: clientResponses,
		Pagination: dto.PaginationInfo{
			Page:  page,
			Limit: limit,
			Total: total,
			Pages: pages,
		},
	}

	return response, nil
}
