package grpcclient

import (
	"context"
	"time"

	identityv1 "github.com/ialekseychuk/my-place-proto/gen/go/identity/v1"
	"github.com/ialekseychuk/my-place/internal/dto"
	"google.golang.org/grpc"
)

type IdentityClient interface {
	Login(ctx context.Context, req *dto.LoginRequest) (*dto.LoginResponse, error)
	RefreshToken(ctx context.Context, req *dto.RefreshTokenRequest) (*dto.RefreshTokenResponse, error)
	Logout(ctx context.Context, req *dto.LogoutRequest) error
}

type identityClient struct {
	rpc  identityv1.IdentityClient
	conn *grpc.ClientConn
}

func NewIdentityClient(p Params) (IdentityClient, func(), error) {
	rpc, _, cleanup, err := New(p,
		func(cc *grpc.ClientConn) identityv1.IdentityClient {
			return identityv1.NewIdentityClient(cc)
		},
	)
	if err != nil {
		return nil, nil, err
	}
	return &identityClient{rpc: rpc}, cleanup, nil
}

func (c *identityClient) Login(ctx context.Context, req *dto.LoginRequest) (*dto.LoginResponse, error) {
	message := &identityv1.LoginRequest{
		Login:    req.Email,
		Password: req.Password,
	}
	ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	resp, err := c.rpc.Login(ctx, message)
	if err != nil {
		return nil, err
	}
	return &dto.LoginResponse{
		Token: mapAuthTokenToDTO(resp.GetAuthToken()),
		User:  mapUserToDTO(resp.GetUser()),
	}, nil
}

func (c *identityClient) RefreshToken(ctx context.Context, req *dto.RefreshTokenRequest) (*dto.RefreshTokenResponse, error) {
	resp, err := c.rpc.RefreshToken(ctx, &identityv1.RefreshTokenRequest{
		RefreshToken: req.RefreshToken,
	})
	if err != nil {
		return nil, err
	}

	return &dto.RefreshTokenResponse{
		Token: mapAuthTokenToDTO(resp.GetAuthToken()),
	}, nil
}

func (c *identityClient) Logout(ctx context.Context, req *dto.LogoutRequest) error {
	_, err := c.rpc.Logout(ctx, &identityv1.LogoutRequest{
		RefreshToken: req.RefreshToken,
	})
	return err
}
