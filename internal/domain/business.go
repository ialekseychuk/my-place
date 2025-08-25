package domain

import "time"

type Business struct {
	ID                       string    `json:"id"`
	Name                     string    `json:"name"`
	BusinessType             string    `json:"business_type"`
	Description              string    `json:"description"`
	Address                  string    `json:"address"`
	City                     string    `json:"city"`
	Phone                    string    `json:"phone"`
	Email                    string    `json:"email"`
	Website                  string    `json:"website"`
	Timezone                 string    `json:"timezone"`
	Currency                 string    `json:"currency"`
	EnableOnlineBooking      bool      `json:"enable_online_booking"`
	EnableSMSNotifications   bool      `json:"enable_sms_notifications"`
	EnableEmailNotifications bool      `json:"enable_email_notifications"`
	CreatedAt                time.Time `json:"created_at"`
	UpdatedAt                time.Time `json:"updated_at"`
}
