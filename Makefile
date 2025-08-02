.PHONY: help install dev build test deploy clean validate setup

# Default target
help:
	@echo "Etsy Manager Pro - Available Commands"
	@echo "===================================="
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make setup       - Complete development environment setup"
	@echo "  make install     - Install dependencies only"
	@echo ""
	@echo "Development:"
	@echo "  make dev         - Start all development servers"
	@echo "  make dev-web     - Start web app only"
	@echo "  make dev-api     - Start API only"
	@echo "  make dev-docker  - Start Docker services for development"
	@echo ""
	@echo "Building:"
	@echo "  make build       - Build all applications"
	@echo "  make build-web   - Build web app only"
	@echo "  make build-api   - Build API only"
	@echo "  make build-docker - Build Docker images"
	@echo ""
	@echo "Testing:"
	@echo "  make test        - Run all tests"
	@echo "  make test-unit   - Run unit tests"
	@echo "  make test-e2e    - Run E2E tests"
	@echo "  make lint        - Run linting"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy      - Deploy with Docker Compose"
	@echo "  make deploy-dev  - Deploy development environment"
	@echo "  make validate    - Validate deployment requirements"
	@echo ""
	@echo "Database:"
	@echo "  make db-setup    - Setup database"
	@echo "  make db-migrate  - Run migrations"
	@echo "  make db-seed     - Seed database"
	@echo "  make db-reset    - Reset database (WARNING: deletes data)"
	@echo ""
	@echo "Utilities:"
	@echo "  make logs        - View Docker logs"
	@echo "  make ps          - View Docker container status"
	@echo "  make clean       - Clean build artifacts"
	@echo "  make stop        - Stop all services"

# Setup & Installation
setup:
	@echo "Setting up development environment..."
	@./scripts/setup-dev-env.sh

install:
	pnpm install

# Development
dev:
	pnpm dev

dev-web:
	pnpm dev:web

dev-api:
	pnpm dev:api

dev-docker:
	docker-compose -f docker-compose.dev.yml up -d

# Building
build:
	pnpm build

build-web:
	pnpm build:web

build-api:
	pnpm build:api

build-docker:
	docker-compose build

build-docker-nocache:
	docker-compose build --no-cache

# Testing
test:
	pnpm test

test-unit:
	pnpm test:unit

test-e2e:
	pnpm test:e2e

lint:
	pnpm lint

typecheck:
	pnpm typecheck

# Deployment
deploy:
	@./scripts/deploy.sh --build

deploy-dev:
	@./scripts/deploy.sh --dev

deploy-validate:
	@./scripts/deploy.sh --validate --build

validate:
	@./scripts/validate-deployment.sh

# Database
db-setup:
	@./scripts/setup-database.sh

db-migrate:
	cd apps/web && pnpm exec prisma migrate deploy

db-migrate-dev:
	cd apps/web && pnpm exec prisma migrate dev

db-seed:
	cd apps/web && pnpm exec prisma db seed

db-studio:
	cd apps/web && pnpm exec prisma studio

db-reset:
	@echo "WARNING: This will delete all data in the database!"
	@echo "Press Ctrl+C to cancel, or Enter to continue..."
	@read confirm
	cd apps/web && pnpm exec prisma migrate reset

# Docker utilities
logs:
	docker-compose logs -f

logs-web:
	docker-compose logs -f web

logs-api:
	docker-compose logs -f api

ps:
	docker-compose ps

stop:
	docker-compose down

stop-all:
	docker-compose down -v

# Cleaning
clean:
	rm -rf node_modules
	rm -rf apps/*/node_modules
	rm -rf packages/*/node_modules
	rm -rf apps/*/dist
	rm -rf apps/*/.next
	rm -rf packages/*/dist
	rm -rf .turbo
	find . -name "*.log" -type f -delete

clean-docker:
	docker system prune -af

# Quick commands
up: deploy-dev
down: stop
restart: stop deploy-dev