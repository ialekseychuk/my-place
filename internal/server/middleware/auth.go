package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/ialekseychuk/my-place/internal/domain"
	"github.com/ialekseychuk/my-place/internal/usecase"
)

type contextKey string

const (
	UserContextKey contextKey = "user"
)

// JWTMiddleware validates JWT tokens and adds user to request context
func JWTMiddleware(authService *usecase.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Extract token from Authorization header
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				ErrorResponse(w, http.StatusUnauthorized, "Missing authorization header")
				return
			}

			// Validate Bearer token format
			tokenParts := strings.Split(authHeader, " ")
			if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
				ErrorResponse(w, http.StatusUnauthorized, "Invalid authorization header format")
				return
			}

			// Validate JWT token
			user, err := authService.ValidateToken(tokenParts[1])
			if err != nil {
				ErrorResponse(w, http.StatusUnauthorized, "Invalid token")
				return
			}

			// Add user to request context
			ctx := context.WithValue(r.Context(), UserContextKey, user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireRole middleware checks if user has required role
func RequireRole(role string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user := GetUserFromContext(r.Context())
			if user == nil {
				ErrorResponse(w, http.StatusUnauthorized, "User not found in context")
				return
			}

			if user.Role != role {
				ErrorResponse(w, http.StatusForbidden, "Insufficient permissions")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// RequireAnyRole middleware checks if user has any of the specified roles
func RequireAnyRole(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user := GetUserFromContext(r.Context())
			if user == nil {
				ErrorResponse(w, http.StatusUnauthorized, "User not found in context")
				return
			}

			hasRole := false
			for _, role := range roles {
				if user.Role == role {
					hasRole = true
					break
				}
			}

			if !hasRole {
				ErrorResponse(w, http.StatusForbidden, "Insufficient permissions")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// RequireBusinessOwner middleware checks if user is owner of the business
func RequireBusinessOwner() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user := GetUserFromContext(r.Context())
			if user == nil {
				ErrorResponse(w, http.StatusUnauthorized, "User not found in context")
				return
			}

			// Extract business ID from URL parameters
			businessID := r.URL.Query().Get("businessID")
			if businessID == "" {
				// Try to get from path parameters (this would need chi router context)
				// For now, we'll check if user is an owner
				if user.Role != "owner" {
					ErrorResponse(w, http.StatusForbidden, "Only business owners can access this resource")
					return
				}
			} else {
				// Check if user owns this specific business
				if user.BusinessID != businessID && user.Role != "owner" {
					ErrorResponse(w, http.StatusForbidden, "Access denied to this business")
					return
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}

// GetUserFromContext extracts user from request context
func GetUserFromContext(ctx context.Context) *domain.User {
	user, ok := ctx.Value(UserContextKey).(*domain.User)
	if !ok {
		return nil
	}
	return user
}

// ErrorResponse sends JSON error response
func ErrorResponse(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	// Note: In production, you'd want proper JSON encoding with error handling
	w.Write([]byte(`{"error":"` + message + `"}`))
}
