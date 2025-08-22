package domain

import "time"


type Business struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Timezone string `json:"timezone"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}