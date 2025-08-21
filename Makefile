# PlantUML Confluence Cloud App Makefile

.PHONY: help install build test lint fmt clean dev deploy-dev deploy-prod

# Default target
help: ## Show this help message
	@echo "PlantUML Confluence Cloud App"
	@echo "Available targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development
install: ## Install all dependencies
	pnpm install

build: ## Build all packages
	pnpm build

test: ## Run all tests
	pnpm test

lint: ## Lint all code
	pnpm lint

fmt: ## Format all code
	pnpm fmt

clean: ## Clean all build artifacts
	pnpm clean

dev: ## Start development servers
	pnpm dev

# AWS Setup
aws-setup: ## Setup AWS resources (SSM parameter)
	@echo "Creating JWT secret in SSM..."
	aws ssm put-parameter \
		--name "/plantuml/renderer/jwt-secret" \
		--value "$$(openssl rand -base64 32)" \
		--type "SecureString" \
		--description "JWT secret for PlantUML renderer" \
		--overwrite || true
	@echo "JWT secret created successfully"

# Deployment
deploy-renderer-dev: ## Deploy renderer to development
	cd services/renderer && sam build && sam deploy --config-env dev

deploy-renderer-prod: ## Deploy renderer to production
	cd services/renderer && sam build && sam deploy --config-env prod

deploy-forge-dev: ## Deploy Forge app to development
	cd apps/forge-plantuml && forge deploy --environment development

deploy-forge-prod: ## Deploy Forge app to production
	cd apps/forge-plantuml && forge deploy --environment production

deploy-dev: deploy-renderer-dev deploy-forge-dev ## Deploy everything to development

deploy-prod: deploy-renderer-prod deploy-forge-prod ## Deploy everything to production

# Local Development
local-renderer: ## Start local renderer service
	cd services/renderer && sam local start-api --port 3001

local-forge: ## Start local Forge tunnel
	cd apps/forge-plantuml && forge tunnel

# Testing
test-unit: ## Run unit tests only
	pnpm -r test

test-e2e: ## Run E2E tests
	cd apps/forge-plantuml && pnpm test:ui

test-integration: ## Run integration tests (requires local renderer)
	cd services/renderer && pnpm test:integration

# Utilities
logs-dev: ## View development logs
	aws logs tail /aws/lambda/plantuml-renderer-dev --follow

logs-prod: ## View production logs
	aws logs tail /aws/lambda/plantuml-renderer-prod --follow

health-check: ## Check renderer health
	@echo "Checking renderer health..."
	@curl -s -X POST "$${RENDERER_URL}/render" \
		-H "Content-Type: application/json" \
		-H "Authorization: Bearer $$(node -e "console.log(require('jsonwebtoken').sign({iss:'plantuml-confluence',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+60,nonce:'test'}, '$${RENDERER_JWT_SECRET}', {algorithm:'HS256'}))")" \
		-d '{"source":"@startuml\\nAlice -> Bob\\n@enduml","format":"svg"}' | jq .

# Security
rotate-jwt: ## Rotate JWT secret
	@echo "Generating new JWT secret..."
	@NEW_SECRET=$$(openssl rand -base64 32) && \
	aws ssm put-parameter \
		--name "/plantuml/renderer/jwt-secret" \
		--value "$$NEW_SECRET" \
		--type "SecureString" \
		--overwrite && \
	echo "New JWT secret: $$NEW_SECRET" && \
	echo "Update RENDERER_JWT_SECRET in Forge environment"

# Documentation
docs: ## Generate documentation
	@echo "Documentation available in:"
	@echo "  README.md - Main documentation"
	@echo "  SECURITY.md - Security documentation"
	@echo "  MARKETPLACE.md - Marketplace publishing guide"
	@echo "  CONTRIBUTING.md - Contributing guidelines"

# Git hooks
hooks: ## Install git hooks
	pnpm prepare