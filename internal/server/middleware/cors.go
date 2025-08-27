package middleware

import (
	"net/http"
	"strings"
)

// CORS middleware adds CORS headers to responses
func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check the Origin header and set appropriate CORS headers
		origin := r.Header.Get("Origin")
		if origin != "" {
			// Allow requests from common development origins
			allowedOrigins := []string{
				"http://localhost:3000",
				"http://localhost:3001",
				"http://127.0.0.1:3000",
				"http://127.0.0.1:3001",
			}

			// Check if the origin is in our allowed list
			for _, allowedOrigin := range allowedOrigins {
				if strings.EqualFold(origin, allowedOrigin) {
					w.Header().Set("Access-Control-Allow-Origin", origin)
					break
				}
			}
		}

		// For production, you might want to set a specific origin or use a more dynamic approach
		// w.Header().Set("Access-Control-Allow-Origin", "*") // Use with caution in production

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
