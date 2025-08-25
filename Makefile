.PHONY: dev up down migrate lint test tidy



# Переменные
ENV_FILE := .env
include $(ENV_FILE)
export $(shell sed 's/=.*//' $(ENV_FILE))

# Цвета
COLOR_RESET = \033[0m
COLOR_RED = \033[31m
COLOR_GREEN = \033[32m
COLOR_YELLOW = \033[33m

help: ## Показать доступные команды
	@echo "$(COLOR_GREEN)Usage:$(COLOR_RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | sed 's/.*Makefile://' | awk 'BEGIN {FS = ":.*?## "}; {printf "$(COLOR_YELLOW)%-20s$(COLOR_RESET) %s\n", $$1, $$2}'


dev: tidy ## Run development environment
	go run ./cmd/api

stop-dev: ## Stop development environment
	lsof -ti:81 | xargs kill -9

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

migrate-create: ## Create new migration
	@echo "Usage: make migrate-create name=<migration_name>"
	@[ "$(name)" ] || (echo "❗  нужно указать name=<migration_name>"; exit 1)
	goose -dir ./migrations create $(name) sql	

swagger: ## Сгенерировать OpenAPI-документацию
	@echo "$(COLOR_GREEN)Checking for swag installation...$(COLOR_RESET)"
	@command -v swag >/dev/null 2>&1 || { echo "$(COLOR_YELLOW)Error: swag not found. Run 'make swagger-init'$(COLOR_RESET)"; exit 1; }
	@echo "$(COLOR_GREEN)Checking for api-spec-converter installation...$(COLOR_RESET)"
	@command -v api-spec-converter >/dev/null 2>&1 || { echo "$(COLOR_YELLOW)Error: api-spec-converter not found. Run 'make swagger-init'$(COLOR_RESET)"; exit 1; }
	@echo "$(COLOR_GREEN)Generating OpenAPI documentation...$(COLOR_RESET)"
	@swag init -g cmd/api/main.go --output ./docs --parseDependency
	@echo "$(COLOR_GREEN)Converting to OpenAPI 3.0...$(COLOR_RESET)"
	@api-spec-converter --from=swagger_2 --to=openapi_3 ./docs/swagger.json > ./docs/openapi3.json
	@echo "$(COLOR_GREEN)Post-processing openapi3.json...$(COLOR_RESET)"
	@go run cmd/swag/postprocess.go
	@echo "$(COLOR_GREEN)OpenAPI documentation generated in ./docs/openapi3.json$(COLOR_RESET)"
	@echo "$(COLOR_RED)Remove tmp files.$(COLOR_RESET)"
	@rm -rf ./docs/swagger.json
	@rm -rf ./docs/swagger.yaml
	@rm -rf ./docs/docs.go
	@echo "$(COLOR_GREEN)Done!$(COLOR_RESET)"




swagger-init: ## Установить swag и api-spec-converter
	@echo "$(COLOR_GREEN)Checking Go installation...$(COLOR_RESET)"
	@command -v go >/dev/null 2>&1 || { echo "$(COLOR_YELLOW)Error: Go is not installed. Please install Go (e.g., 'brew install go' on macOS).$(COLOR_RESET)"; exit 1; }
	@echo "$(COLOR_GREEN)Checking GOPATH...$(COLOR_RESET)"
	@if [ -z "$$GOPATH" ]; then \
		echo "$(COLOR_YELLOW)Warning: GOPATH is not set. Using default: $$HOME/go$(COLOR_RESET)"; \
		export GOPATH=$$HOME/go; \
		if [ ! -d "$$HOME/go/bin" ]; then mkdir -p "$$HOME/go/bin"; fi; \
		if ! echo $$PATH | grep -q "$$HOME/go/bin"; then \
			echo "$(COLOR_YELLOW)Warning: $$HOME/go/bin is not in PATH. Add it manually to your shell configuration (e.g., ~/.zshrc or ~/.bashrc):$(COLOR_RESET)"; \
			echo "$(COLOR_YELLOW)  export PATH=\$$PATH:\$$HOME/go/bin$(COLOR_RESET)"; \
		fi; \
	fi
	@echo "$(COLOR_GREEN)Installing swag...$(COLOR_RESET)"
	@go install github.com/swaggo/swag/cmd/swag@latest || { echo "$(COLOR_YELLOW)Error: Failed to install swag. Check Go configuration and internet connection.$(COLOR_RESET)"; exit 1; }
	@echo "$(COLOR_GREEN)Checking npm installation...$(COLOR_RESET)"
	@command -v npm >/dev/null 2>&1 || { echo "$(COLOR_YELLOW)Error: npm is not installed. Please install Node.js (e.g., 'brew install node' on macOS).$(COLOR_RESET)"; exit 1; }
	@echo "$(COLOR_GREEN)Installing api-spec-converter...$(COLOR_RESET)"
	@npm install -g api-spec-converter || { echo "$(COLOR_YELLOW)Error: Failed to install api-spec-converter. Check npm configuration and internet connection.$(COLOR_RESET)"; exit 1; }
	@echo "$(COLOR_GREEN)Verifying installations...$(COLOR_RESET)"
	@command -v swag >/dev/null 2>&1 || { echo "$(COLOR_YELLOW)Error: swag not found in PATH. Ensure $$GOPATH/bin is in PATH (e.g., 'export PATH=\$$PATH:$$GOPATH/bin' in ~/.zshrc).$(COLOR_RESET)"; exit 1; }
	@command -v api-spec-converter >/dev/null 2>&1 || { echo "$(COLOR_YELLOW)Error: api-spec-converter not found in PATH. Ensure npm global bin directory (e.g., /usr/local/bin) is in PATH.$(COLOR_RESET)"; exit 1; }
	@echo "$(COLOR_GREEN)swagger-init completed successfully. Run 'make swagger' to generate documentation.$(COLOR_RESET)"
	