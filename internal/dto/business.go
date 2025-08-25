package dto

type WorkingHoursDTO struct {
	Start   string `json:"start" validate:"required"`
	End     string `json:"end" validate:"required"`
	Enabled bool   `json:"enabled"`
}

type WorkingHoursWeekDTO struct {
	Monday    WorkingHoursDTO `json:"monday"`
	Tuesday   WorkingHoursDTO `json:"tuesday"`
	Wednesday WorkingHoursDTO `json:"wednesday"`
	Thursday  WorkingHoursDTO `json:"thursday"`
	Friday    WorkingHoursDTO `json:"friday"`
	Saturday  WorkingHoursDTO `json:"saturday"`
	Sunday    WorkingHoursDTO `json:"sunday"`
}

type CreateBusinessRequest struct {
	// Business Information
	BusinessName string `json:"businessName" validate:"required,min=3,max=100"`
	BusinessType string `json:"businessType" validate:"required"`
	Description  string `json:"description"`

	// Contact Information
	Address string `json:"address" validate:"required"`
	City    string `json:"city" validate:"required"`
	Phone   string `json:"phone" validate:"required"`
	Email   string `json:"email" validate:"required,email"`
	Website string `json:"website"`

	// Owner Information
	OwnerFirstName       string `json:"ownerFirstName" validate:"required,min=2,max=50"`
	OwnerLastName        string `json:"ownerLastName" validate:"required,min=2,max=50"`
	OwnerPhone           string `json:"ownerPhone" validate:"required"`
	OwnerEmail           string `json:"ownerEmail" validate:"required,email"`
	OwnerPassword        string `json:"ownerPassword" validate:"required,min=8"`
	OwnerPasswordConfirm string `json:"ownerPasswordConfirm" validate:"required,eqfield=OwnerPassword"`

	// Business Settings
	WorkingHours WorkingHoursWeekDTO `json:"workingHours" validate:"required"`
	Timezone     string              `json:"timezone" validate:"required,timezone"`
	Currency     string              `json:"currency" validate:"required"`

	// Additional Settings
	EnableOnlineBooking      bool `json:"enableOnlineBooking"`
	EnableSMSNotifications   bool `json:"enableSMSNotifications"`
	EnableEmailNotifications bool `json:"enableEmailNotifications"`
	AcceptTerms              bool `json:"acceptTerms" validate:"required,eq=true"`
}

type CreateBusinessResponse struct {
	BusinessID string `json:"business_id"`
	UserID     string `json:"user_id"`
	Message    string `json:"message"`
}
