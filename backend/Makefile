# WIT ERP — backend Makefile
# Common targets for local development. Run `make help` for the full list.

DB_URL ?= postgres://wit:wit@localhost:5432/wit_erp?sslmode=disable
MIGRATE ?= go run -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate
SERVICE ?= hr-service

.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

.PHONY: tidy
tidy: ## go mod tidy
	go mod tidy

.PHONY: deps
deps: ## Download Go module dependencies
	go mod download

.PHONY: build
build: ## Build a single service (SERVICE=hr-service|api-gateway)
	go build -o bin/$(SERVICE) ./cmd/$(SERVICE)

.PHONY: build-all
build-all: ## Build every cmd/* binary
	@for dir in cmd/*/; do \
		name=$$(basename $$dir); \
		echo "→ building $$name"; \
		go build -o bin/$$name ./$$dir; \
	done

.PHONY: run-hr
run-hr: ## Run the HR microservice locally
	HR_HTTP_PORT=8081 go run ./cmd/hr-service

.PHONY: run-gateway
run-gateway: ## Run the API gateway locally
	GATEWAY_HTTP_PORT=8080 go run ./cmd/api-gateway

.PHONY: db-up
db-up: ## Start Postgres in Docker
	docker-compose up -d postgres

.PHONY: db-down
db-down: ## Stop Postgres
	docker-compose down

.PHONY: db-reset
db-reset: ## Drop the database volume and recreate (destructive)
	docker-compose down -v
	docker-compose up -d postgres

.PHONY: migrate-up
migrate-up: ## Apply all up-migrations
	$(MIGRATE) -path migrations -database "$(DB_URL)" up

.PHONY: migrate-down
migrate-down: ## Roll back the latest migration
	$(MIGRATE) -path migrations -database "$(DB_URL)" down 1

.PHONY: migrate-status
migrate-status: ## Show the current migration version
	$(MIGRATE) -path migrations -database "$(DB_URL)" version

.PHONY: migrate-new
migrate-new: ## Create a new migration: make migrate-new name=add_xyz
	@test -n "$(name)" || (echo "set name=… e.g. make migrate-new name=add_payroll"; exit 1)
	$(MIGRATE) create -ext sql -dir migrations -seq $(name)

.PHONY: test
test: ## Run unit tests
	go test ./... -race -count=1

.PHONY: lint
lint: ## Run go vet (add golangci-lint here when set up)
	go vet ./...

.PHONY: dev
dev: db-up ## Start postgres + run HR service locally
	@sleep 2
	$(MAKE) run-hr

.PHONY: full
full: ## Run everything in docker (postgres + gateway + hr-service)
	docker-compose --profile full up --build

.PHONY: clean
clean: ## Remove built binaries
	rm -rf bin/
