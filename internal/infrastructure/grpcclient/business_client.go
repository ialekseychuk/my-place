package grpcclient

import (
	"context"
	"log"

	companyv1 "github.com/ialekseychuk/my-place-proto/gen/go/company/v1"
	"github.com/ialekseychuk/my-place/internal/dto"
	"google.golang.org/grpc"
)

// var _ companyv1.CompanyClient = (*businessClient)(nil)

type businessClient struct {
	rpc  companyv1.CompanyClient
	conn *grpc.ClientConn
}

type BusinessClient interface {
	RegisterBusiness(ctx context.Context, dto *dto.CreateBusinessRequest) (*dto.BusinessCreateResponse, error)
	//CreateBusiness(ctx context.Context, dto *dto.CreateBusinessRequest) (*dto.Business, error)
	GetBusiness(ctx context.Context, id string) (*dto.Business, error)
	GetBusinessByOwner(ctx context.Context, id string) (*dto.Business, error)
	CreateLocation(ctx context.Context, in *dto.LocationRequest) (*dto.LocationResponse, error)
	GetLocation(ctx context.Context, id string) (*dto.LocationResponse, error)
}

func NewBusinessClient(p Params) (BusinessClient, func(), error) {
	rpc, _, cleanup, err := New(p,
		func(cc *grpc.ClientConn) companyv1.CompanyClient {
			return companyv1.NewCompanyClient(cc)
		},
	)
	if err != nil {
		return nil, nil, err
	}
	return &businessClient{rpc: rpc}, cleanup, nil
}

func (c *businessClient) RegisterBusiness(ctx context.Context, req *dto.CreateBusinessRequest) (*dto.BusinessCreateResponse, error) {
	log.Printf("gRPC client: Creating business request for %s", req.BusinessName)

	b := &companyv1.RegisterBusinessRequest{
		Name:                     req.BusinessName,
		Description:              req.Description,
		BussinesType:             req.BusinessType,
		Currency:                 req.Currency,
		Timezone:                 req.Timezone,
		EnableOnlineBooking:      req.EnableOnlineBooking,
		EnableEmailNotifications: req.EnableEmailNotifications,
		EnableSmsNotifications:   req.EnableSMSNotifications,
		Address:                  req.Address,
		City:                     req.City,
		Phone:                    req.Phone,
		OwnerFirstName:           req.OwnerFirstName,
		OwnerLastName:            req.OwnerLastName,
		OwnerEmail:               req.OwnerEmail,
		OwnerPhone:               req.OwnerPhone,
		OwnerPassword:            req.OwnerPassword,
	}

	log.Printf("gRPC client: Calling RegisterBusiness gRPC method for %s", req.BusinessName)
	resp, err := c.rpc.RegisterBusiness(ctx, b)
	if err != nil {
		log.Printf("gRPC client: Failed to register business %s: %v", req.BusinessName, err)
		return nil, err
	}

	log.Printf("gRPC client: Successfully registered business %s with ID %s", req.BusinessName, resp.Business.Id)

	response := &dto.BusinessCreateResponse{
		Business:  mapBusinessToDTO(resp.Business),
		User:      mapUserToDTO(resp.Owner),
		AuthToken: mapAuthTokenToDTO(resp.AuthToken),
		Message:   resp.Message,
	}
	return response, nil
}

func (c *businessClient) GetBusiness(ctx context.Context, id string) (*dto.Business, error) {
	req := &companyv1.GetBusinessRequest{
		Id: id,
	}
	resp, err := c.rpc.GetBusiness(ctx, req)
	if err != nil {
		return nil, err
	}
	return mapBusinessToDTO(resp.GetBusiness()), nil
}

func (c *businessClient) GetBusinessByOwner(ctx context.Context, id string) (*dto.Business, error) {
	req := &companyv1.GetBussinesByOwnerRequest{
		OwnerId: id,
	}
	resp, err := c.rpc.GetBusinessByOwner(ctx, req)
	if err != nil {
		return nil, err
	}
	return mapBusinessToDTO(resp.GetBusiness()), nil

}

func (c *businessClient) CreateBusiness(ctx context.Context, req *dto.CreateBusinessRequest) (*dto.Business, error) {
	panic(" will be removed")
}

func (c *businessClient) CreateLocation(ctx context.Context, req *dto.LocationRequest) (*dto.LocationResponse, error) {
	resp, err := c.rpc.CreateLocation(ctx, &companyv1.CreateLocationRequest{
		BusinessId: req.BusinessID,
		Name:       req.Name,
		Address:    req.Address,
		City:       req.City,
		Timezone:   req.Timezone,
		Currency:   req.Currency,
	})
	if err != nil {
		return nil, err
	}

	return mapLocationToDTO(resp.GetLocation()), nil
}

func (c *businessClient) GetLocation(ctx context.Context, id string) (*dto.LocationResponse, error) {
	resp, err := c.rpc.GetLocation(ctx, &companyv1.GetLocationRequest{
		Id: id,
	})
	if err != nil {
		return nil, err
	}

	return mapLocationToDTO(resp.GetLocation()), nil
}
