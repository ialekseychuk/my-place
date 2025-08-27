package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/ialekseychuk/my-place/internal/usecase"
)

type ClientHandler struct {
	clientService *usecase.ClientService
}

func NewClientHandler(clientService *usecase.ClientService) *ClientHandler {
	return &ClientHandler{
		clientService: clientService,
	}
}

func (h *ClientHandler) Routes() chi.Router {
	r := chi.NewRouter()
	
	r.Get("/", h.GetClients)
	
	return r
}

func (h *ClientHandler) GetClients(w http.ResponseWriter, r *http.Request) {
	
	businessID := chi.URLParam(r, "businessID")
	if businessID == "" {
		http.Error(w, "business ID is required", http.StatusBadRequest)
		return
	}
	
	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")
	search := r.URL.Query().Get("search")
	
	page := 1
	limit := 10
	
	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}
	
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}
	
	// Call service to get clients
	response, err := h.clientService.GetClients(r.Context(), businessID, page, limit, search)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "Failed to get clients")
		return
	}
	
	
	if err := json.NewEncoder(w).Encode(response); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "Failed to get clients")
		return
	}
}