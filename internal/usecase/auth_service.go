package usecase

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/ialekseychuk/my-place/internal/domain"
	"github.com/ialekseychuk/my-place/internal/dto"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo               domain.UserRepository
	jwtSecret              string
	accessTokenExpiryTime  time.Duration
	refreshTokenExpiryTime time.Duration
}

func NewAuthService(userRepo domain.UserRepository, jwtSecret string) *AuthService {
	return &AuthService{
		userRepo:               userRepo,
		jwtSecret:              jwtSecret,
		accessTokenExpiryTime:  24 * time.Hour,      // 24 hours
		refreshTokenExpiryTime: 30 * 24 * time.Hour, // 30 days
	}
}

func (s *AuthService) Login(ctx context.Context, req dto.LoginRequest) (*dto.LoginResponse, error) {
	// Find user by email
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	// Check if user is active
	if !user.IsActive {
		return nil, errors.New("account is disabled")
	}

	// Verify password
	if !s.verifyPassword(req.Password, user.Password) {
		return nil, errors.New("invalid email or password")
	}

	// Generate tokens
	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err := s.generateRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Don't return password in response
	user.Password = ""

	return &dto.LoginResponse{
		User: user,
		Token: &domain.AuthToken{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
			ExpiresAt:    time.Now().Add(s.accessTokenExpiryTime),
			TokenType:    "Bearer",
		},
	}, nil
}

func (s *AuthService) RefreshToken(ctx context.Context, req dto.RefreshTokenRequest) (*dto.RefreshTokenResponse, error) {
	// In a production system, you would validate the refresh token against stored sessions
	// For now, we'll implement a simple refresh mechanism

	// Parse the refresh token to get user info (this is simplified)
	// In production, store refresh tokens in database with expiry
	if req.RefreshToken == "" {
		return nil, errors.New("refresh token is required")
	}

	// For demonstration, we'll generate a new access token
	// In production, validate refresh token and get user from database
	return nil, errors.New("refresh token functionality not fully implemented")
}

func (s *AuthService) ValidateToken(tokenString string) (*domain.User, error) {
	// Parse the token
	token, err := jwt.ParseWithClaims(tokenString, &domain.JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.jwtSecret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	// Validate token and extract claims
	claims, ok := token.Claims.(*domain.JWTClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	// Check if token is expired
	if time.Unix(claims.ExpiresAt, 0).Before(time.Now()) {
		return nil, errors.New("token expired")
	}

	// Get user from database to ensure user still exists and is active
	user, err := s.userRepo.GetById(context.Background(), claims.UserID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if !user.IsActive {
		return nil, errors.New("user account is disabled")
	}

	// Don't return password
	user.Password = ""
	return user, nil
}

func (s *AuthService) generateAccessToken(user *domain.User) (string, error) {
	now := time.Now()
	expiryTime := now.Add(s.accessTokenExpiryTime)

	claims := &domain.JWTClaims{
		UserID:     user.ID,
		BusinessID: user.BusinessID,
		Email:      user.Email,
		Role:       user.Role,
		IssuedAt:   now.Unix(),
		ExpiresAt:  expiryTime.Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

func (s *AuthService) generateRefreshToken() (string, error) {
	// Generate a random refresh token
	bytes := make([]byte, 32)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", fmt.Errorf("failed to generate refresh token: %w", err)
	}
	return hex.EncodeToString(bytes), nil
}

func (s *AuthService) verifyPassword(plainPassword, hashedPassword string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(plainPassword))
	return err == nil
}
