package grpcclient

import (
	companyv1 "github.com/ialekseychuk/my-place-proto/gen/go/company/v1"
	identityv1 "github.com/ialekseychuk/my-place-proto/gen/go/identity/v1"
	"github.com/ialekseychuk/my-place/internal/dto"
)

func mapBusinessToDTO(pb *companyv1.Business) *dto.Business {
	return &dto.Business{
		ID:          pb.Id,
		Name:        pb.Name,
		Description: pb.Description,
		Timezone:    pb.Timezone,
		OwnerID:     pb.OwnerId,
		CreatedAt:   pb.CreatedAt.AsTime(),
		UpdatedAt:   pb.UpdatedAt.AsTime(),
	}
}

func mapUserToDTO(pb *identityv1.User) *dto.UserProfileResponse {
	return &dto.UserProfileResponse{
		ID:        pb.Id,
		FirstName: pb.FirstName,
		LastName:  pb.LastName,
		Email:     pb.Email,
		Phone:     pb.Phone,
		Role:      pb.Role,
		IsActive:  pb.IsActive,
		CreatedAt: pb.CreatedAt.AsTime(),
		UpdatedAt: pb.UpdatedAt.AsTime(),
	}
}

func mapAuthTokenToDTO(t *identityv1.AuthToken) *dto.AuthToken {
	return &dto.AuthToken{
		AccessToken:  t.GetAccessToken(),
		RefreshToken: t.GetRefreshToken(),
		ExpiresAt:    t.GetExpiredAt().AsTime(),
		TokenType:    t.GetTokenType(),
	}
}

func mapLocationToDTO(t *companyv1.Location) *dto.LocationResponse {
	return &dto.LocationResponse{
		ID:          t.GetId(),
		BusinessID:  t.GetBusinessId(),
		Name:        t.GetName(),
		Address:     t.GetAddress(),
		City:        t.GetCity(),
		ContactInfo: "",
		Timezone:    t.GetTimezone(),
		CreatedAt:   t.CreatedAt.AsTime(),
		UpdatedAt:   t.UpdatedAt.AsTime(),
	}
}
