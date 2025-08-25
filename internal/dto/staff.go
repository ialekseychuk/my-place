package dto

type CreateStaffRequest struct {
	FullName string `json:"name" validate:"required,min=3,max=100"`
}