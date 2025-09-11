package domain

import "time"

type Business struct {
	ID                       string    `json:"id"`
	Name                     string    `json:"name"`
	BusinessType             string    `json:"business_type"`
	Description              string    `json:"description"`
	OwnerID                  string    `json:"owner_id"`
	Timezone                 string    `json:"timezone"`
	Currency                 string    `json:"currency"`
	CreatedAt                time.Time `json:"created_at"`
	UpdatedAt                time.Time `json:"updated_at"`
}
