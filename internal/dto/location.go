package dto

type LocationRequest struct {
	Name        string `json:"name" validate:"required"`
	Address     string `json:"address" validate:"required"`
	City        string `json:"city" validate:"required"`
	ContactInfo string `json:"contact_info"`
	Timezone    string `json:"timezone" validate:"required"`
}

type LocationResponse struct {
	ID          string `json:"id"`
	BusinessID  string `json:"business_id"`
	Name        string `json:"name"`
	Address     string `json:"address"`
	City        string `json:"city"`
	ContactInfo string `json:"contact_info"`
	Timezone    string `json:"timezone"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

type LocationListResponse struct {
	Locations []LocationResponse `json:"locations"`
}
