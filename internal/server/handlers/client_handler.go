package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/ialekseychuk/my-place/internal/usecase"
	_ "github.com/ialekseychuk/my-place/internal/dto"
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

// @Summary  Get clients
// @Description Get paginated list of clients
// @Tags Clients
// @Accept json
// @Produce json
// @Param business_id path string true "Business ID"
// @Param page query int false "Page number"
// @Param limit query int false "Number of items per page"
// @Param search query string false "Search query"
// @Success 200 {object} dto.ClientListResponse
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 401 {object} dto.ErrorResponse "Unauthorized"
// @Failure 403 {object} dto.ErrorResponse "Forbidden"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID}/clients [get]
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
