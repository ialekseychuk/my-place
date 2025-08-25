package domain

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type AuthToken struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
	TokenType    string    `json:"token_type"`
}

type JWTClaims struct {
	UserID     string `json:"user_id"`
	BusinessID string `json:"business_id"`
	Email      string `json:"email"`
	Role       string `json:"role"`
	IssuedAt   int64  `json:"iat"`
	ExpiresAt  int64  `json:"exp"`
	jwt.RegisteredClaims
}

// Valid validates the claims
func (c JWTClaims) Valid() error {
	if time.Unix(c.ExpiresAt, 0).Before(time.Now()) {
		return jwt.ErrTokenExpired
	}
	return nil
}

type UserSession struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
	IsRevoked    bool      `json:"is_revoked"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
