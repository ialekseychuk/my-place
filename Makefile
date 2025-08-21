.PHONY: dev up down migrate lint test tidy

dev: tidy
	go run ./cmd/api

up:
	docker compose up -d

down:
	docker compose down

migrate:
	go run ./cmd/migrate

lint:
	golangci-lint run

test:
	go test -race ./...

tidy:
	go mod tidy