package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/ialekseychuk/my-place/internal/dto"
	"github.com/ialekseychuk/my-place/internal/infrastructure/grpcclient"
	"github.com/ialekseychuk/my-place/pkg/validate"
)

type BusinessHandler struct {

	businessGrpc grpcclient.BusinessClient
}

func NewBusinessHandler( bg grpcclient.BusinessClient) *BusinessHandler {
	return &BusinessHandler{
		businessGrpc: bg,
	}
}

func (h *BusinessHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Post("/register", h.RegisterBusiness)
	r.Get("/{id}", h.GetBusiness)
	return r
}


// @Summary Register a new Business with owner and settings
// @Description Creates a new business with complete registration including owner and working hours
// @Tags Business
// @Accept json
// @Produce json
// @Param registration body dto.CreateBusinessRequest true "Business registration object"
// @Success 201 {object} dto.BusinessCreateResponse
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Router /api/v1/businesses/register [post]
func (h *BusinessHandler) RegisterBusiness(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateBusinessRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	log.Printf("RegisterBusiness: Request body decoded successfully, business name: %s", req.BusinessName)

	if errs := validate.Struct(req); errs != nil {
		log.Printf("RegisterBusiness validation: %v", errs)
		ValidationErrorsResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(r.Context(), 1000*time.Second)
	defer cancel()

	log.Printf("RegisterBusiness: Calling businessGrpc.CreateBusiness with business name: %s", req.BusinessName)

	resp, err := h.businessGrpc.RegisterBusiness(ctx, &req)
	if err != nil {
		log.Printf("RegisterBusiness gRPC error: %v", err)
		code, msg := grpcclient.GRPCErrorToHttp(err)
		ErrorResponse(w, code, msg)
		return
	}

	log.Printf("RegisterBusiness: Sending response back to client")

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resp)
}

// @Summary Get company by id
// @Description Get company by id
// @Tags Business
// @Accept json
// @Produce json
// @Param businessID path string true "Business ID"
// @Success 200 {object} dto.BusinessCreateResponse
// @Failure 404
// @Failure 422 {object} map[string]string "Validation errors"
// @Failure 401 {object} dto.ErrorResponse "Unauthorized"
// @Failure 403 {object} dto.ErrorResponse "Forbidden"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Security Bearer
// @Router /api/v1/businesses/{businessID} [get]
func (h *BusinessHandler) GetBusiness(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "businessID")

	resp, err := h.businessGrpc.GetBusiness(r.Context(), id)
	if err != nil {
		code, msg := grpcclient.GRPCErrorToHttp(err)
		ErrorResponse(w, code, msg)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resp)
}
