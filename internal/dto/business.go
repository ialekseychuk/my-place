package dto


type CreateBusinessRequest struct {
	Name string `json:"name" validate:"required,min=3,max=100"`
	Timezone string `json:"timezone" validate:"required,timezone"`
}

