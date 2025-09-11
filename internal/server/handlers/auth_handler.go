package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/ialekseychuk/my-place/internal/dto"
	"github.com/ialekseychuk/my-place/internal/infrastructure/grpcclient"

	"github.com/ialekseychuk/my-place/pkg/validate"
)

type AuthHandler struct {
	identityGrpc grpcclient.IdentityClient
}

func NewAuthHandler(identityGrpc grpcclient.IdentityClient) *AuthHandler {
	return &AuthHandler{
		identityGrpc: identityGrpc,
	}
}

func (h *AuthHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Post("/login", h.Login)
	r.Post("/refresh", h.RefreshToken)
	r.Post("/logout", h.Logout)
	return r
}

// @Summary User login
// @Description Authenticate user with email and password
// @Tags Auth
// @Accept json
// @Produce json
// @Param credentials body dto.LoginRequest true "Login credentials"
// @Success 200 {object} dto.LoginResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 401 {object} dto.ErrorResponse "Invalid credentials"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Router /api/v1/auth/login [post]
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req dto.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	resp, err := h.identityGrpc.Login(r.Context(), &req)

	if err != nil {
		code, msg := grpcclient.GRPCErrorToHttp(err)
		ErrorResponse(w, code, msg)
	}

	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// @Summary Refresh access token
// @Description Get new access token using refresh token
// @Tags Auth
// @Accept json
// @Produce json
// @Param refresh body dto.RefreshTokenRequest true "Refresh token"
// @Success 200 {object} dto.RefreshTokenResponse
// @Failure 400 {object} dto.ErrorResponse "Bad request"
// @Failure 401 {object} dto.ErrorResponse "Invalid refresh token"
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Router /api/v1/auth/refresh [post]
func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var req dto.RefreshTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	resp, err := h.identityGrpc.RefreshToken(r.Context(), &req)

	if err != nil {
		code, msg := grpcclient.GRPCErrorToHttp(err)
		ErrorResponse(w, code, msg)
		return
	}

	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// @Summary User logout
// @Description Logout user (invalidate tokens). Refresh token will be invalidated
// @Tags Auth
// @Accept json
// @Produce json
// @Param refresh body dto.LogoutRequest true "Refresh token"
// @Success 200
// @Failure 401 {object} dto.ErrorResponse "Unauthorized"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/auth/logout [post]
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	var req dto.LogoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if errs := validate.Struct(req); errs != nil {
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	err := h.identityGrpc.Logout(r.Context(), &req)
	if err != nil {
		code, msg := grpcclient.GRPCErrorToHttp(err)
		ErrorResponse(w, code, msg)
		return
	}
	w.WriteHeader(http.StatusOK)
	
}

// @Summary Get current user profile
// @Description Get current authenticated user's profile
// @Tags Auth
// @Produce json
// @Success 200 {object} dto.UserProfileResponse
// @Failure 401 {object} dto.ErrorResponse "Unauthorized"
// @Security Bearer
// @Router /api/v1/auth/profile [get]
func (h *AuthHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	// This would be called only on authenticated routes
	// User would be available in context via JWT middleware

	// For now, return a placeholder response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(map[string]string{
		"message": "Profile endpoint - implement user extraction from context",
	}); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "Failed to encode response")
		return
	}
}
