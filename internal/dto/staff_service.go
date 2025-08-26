package dto

// AssignServiceToStaffRequest represents the request to assign a service to staff
type AssignServiceToStaffRequest struct {
	ServiceID string `json:"service_id" validate:"required,uuid4"`
}

// AssignMultipleServicesToStaffRequest represents the request to assign multiple services to staff
type AssignMultipleServicesToStaffRequest struct {
	ServiceIDs []string `json:"service_ids" validate:"required,dive,uuid4"`
}

// StaffServiceResponse represents a staff-service relationship in API responses
type StaffServiceResponse struct {
	ID          string `json:"id"`
	StaffID     string `json:"staff_id"`
	ServiceID   string `json:"service_id"`
	StaffName   string `json:"staff_name"`
	ServiceName string `json:"service_name"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

// StaffWithServicesResponse represents a staff member with their assigned services
type StaffWithServicesResponse struct {
	ID             string            `json:"id"`
	BusinessID     string            `json:"business_id"`
	FirstName      string            `json:"first_name"`
	LastName       string            `json:"last_name"`
	FullName       string            `json:"full_name"`
	Phone          string            `json:"phone,omitempty"`
	Gender         string            `json:"gender,omitempty"`
	Position       string            `json:"position"`
	Description    string            `json:"description,omitempty"`
	Specialization string            `json:"specialization,omitempty"`
	IsActive       bool              `json:"is_active"`
	Services       []ServiceResponse `json:"services"`
	CreatedAt      string            `json:"created_at"`
	UpdatedAt      string            `json:"updated_at"`
}
