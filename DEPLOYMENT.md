# Deployment Configuration

This document describes the deployment configuration for the PlantUML Confluence App with proper environment separation.

## Environment Configuration

### AWS Lambda Stacks

| Environment | Stack Name | API URL | JWT Secret Parameter |
|-------------|------------|---------|---------------------|
| **Development** | `plantuml-renderer-dev` | `https://q2cro7gz51.execute-api.eu-north-1.amazonaws.com/dev` | `/plantuml/renderer/jwt-secret-dev` |
| **Production** | `plantuml-renderer-prod` | `https://gezrf8c2xa.execute-api.eu-north-1.amazonaws.com/prod` | `/plantuml/renderer/jwt-secret-prod` |

### Forge App Environments

| Environment | Purpose | AWS Stack Used |
|-------------|---------|----------------|
| **development** | Testing and development | `plantuml-renderer-dev` |
| **production** | Live production use | `plantuml-renderer-prod` |

## Deployment Commands

### Full Deployment (AWS + Forge)

```bash
# Deploy development environment
./deploy.sh dev development

# Deploy production environment  
./deploy.sh prod production
```

### AWS Lambda Only

```bash
# Development stack
cd services/renderer
sam deploy --config-env dev --profile plant-uml --region eu-north-1

# Production stack
cd services/renderer
sam deploy --config-env prod --profile plant-uml --region eu-north-1
```

### Forge App Only

```bash
# Development environment
./deploy-forge.sh development

# Production environment
./deploy-forge.sh production
```

## Environment Variables

The deployment scripts automatically configure the following Forge environment variables:

### Development Environment
- `RENDERER_URL`: `https://q2cro7gz51.execute-api.eu-north-1.amazonaws.com/dev`
- `RENDERER_JWT_SECRET`: Retrieved from `/plantuml/renderer/jwt-secret-dev`

### Production Environment
- `RENDERER_URL`: `https://gezrf8c2xa.execute-api.eu-north-1.amazonaws.com/prod`
- `RENDERER_JWT_SECRET`: Retrieved from `/plantuml/renderer/jwt-secret-prod`

## Configuration Files

- `apps/forge-plantuml/config/development.json`: Development environment configuration
- `apps/forge-plantuml/config/production.json`: Production environment configuration
- `apps/forge-plantuml/manifest.yml`: Updated with both dev and prod URLs in external fetch permissions

## Health Check Endpoints

Test that your deployments are working:

```bash
# Development
curl https://q2cro7gz51.execute-api.eu-north-1.amazonaws.com/dev/health

# Production
curl https://gezrf8c2xa.execute-api.eu-north-1.amazonaws.com/prod/health
```

Expected response:
```json
{"status":"healthy","timestamp":"2025-09-17T12:40:27.469829Z"}
```

## Manual Forge Configuration

If you need to manually set environment variables:

```bash
cd apps/forge-plantuml

# Development
forge variables set RENDERER_URL "https://q2cro7gz51.execute-api.eu-north-1.amazonaws.com/dev" --environment development
forge variables set RENDERER_JWT_SECRET "your-dev-secret" --environment development

# Production
forge variables set RENDERER_URL "https://gezrf8c2xa.execute-api.eu-north-1.amazonaws.com/prod" --environment production
forge variables set RENDERER_JWT_SECRET "your-prod-secret" --environment production
```

## Verification

After deployment, verify the configuration:

```bash
# Check Forge variables
cd apps/forge-plantuml
forge variables list --environment development
forge variables list --environment production

# Check AWS stacks
aws cloudformation describe-stacks --profile plant-uml --region eu-north-1 --stack-name plantuml-renderer-dev
aws cloudformation describe-stacks --profile plant-uml --region eu-north-1 --stack-name plantuml-renderer-prod
```