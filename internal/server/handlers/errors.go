package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/ialekseychuk/my-place/internal/dto"
)

func ErrorResponse(w http.ResponseWriter, code int, message string) {
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(dto.ErrorResponse{
		Error: message,
	})
}

func ValidationErrorsResponse(w http.ResponseWriter, code int, errs map[string]string) {
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(errs)
}