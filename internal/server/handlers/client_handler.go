package handlers

import "github.com/ialekseychuk/my-place/internal/usecase"

type ClientHandler struct {
	clientService *usecase.ClientService
}