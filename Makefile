.PHONY: dev up down migrate lint test tidy



# Переменные
ENV_FILE := .env
include $(ENV_FILE)
export $(shell sed 's/=.*//' $(ENV_FILE))

# Цвета
COLOR_RESET = \033[0m
COLOR_GREEN = \033[32m
COLOR_YELLOW = \033[33m

help: ## Показать доступные команды
	@echo "$(COLOR_GREEN)Usage:$(COLOR_RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | sed 's/.*Makefile://' | awk 'BEGIN {FS = ":.*?## "}; {printf "$(COLOR_YELLOW)%-20s$(COLOR_RESET) %s\n", $$1, $$2}'


dev: tidy ## Run development environment
	go run ./cmd/api

up: ## Run docker
	docker compose up -d

down: ## Stop docker
	docker compose down


lint: ## Run linter
	golangci-lint run

test: ## Run tests
	go test -race ./...

tidy: ## Run go mod tidy
	go mod tidy

migrate-up: ## Run migrations
	goose -dir ./migrations postgres "${POSTGRES_DSN}" up

migrate-down: ## Run migrations rollback
	goose -dir ./migrations postgres "${POSTGRES_DSN}" down

migrate-status: ## Run migrations status
	goose -dir ./migrations postgres "${POSTGRES_DSN}" status