# Quick Start Guide

Get PlantUML Confluence app running in 10 minutes.

## 📋 Prerequisites

### Required Tools
- **Java 11+** (for renderer development)
- **Node.js 18+** and npm 8+
- **AWS CLI** configured with credentials
- **AWS SAM CLI** installed
- **Forge CLI**: `npm install -g @forge/cli`

### Required Accounts
- **AWS Account** with Lambda and API Gateway permissions
- **Atlassian Account** with Forge development access
- **Confluence Cloud** instance for testing

### Get Forge API Token
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Create new token with label "PlantUML Development"
3. Copy the token (you'll need it below)

## 🚀 Setup Steps

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd plant-uml-confluence
npm install
```

### 2. Configure AWS Environment
```bash
# Verify AWS CLI is configured
aws sts get-caller-identity

# Set your AWS region (adjust as needed)
export AWS_DEFAULT_REGION=eu-north-1
```

### 3. Create JWT Secrets for Each Environment
```bash
# Development secret
aws ssm put-parameter \
  --name "/plantuml/renderer/jwt-secret-dev" \
  --value "$(openssl rand -base64 32)" \
  --type "SecureString" \
  --description "JWT secret for PlantUML renderer - DEV"

# Production secret (different value!)
aws ssm put-parameter \
  --name "/plantuml/renderer/jwt-secret-prod" \
  --value "$(openssl rand -base64 32)" \
  --type "SecureString" \
  --description "JWT secret for PlantUML renderer - PROD"
```

### 4. Deploy AWS Lambda Renderer Service
```bash
cd services/renderer

# Build and deploy to development
sam build
sam deploy --config-env dev

# Get the API endpoint URL (save this!)
DEV_URL=$(aws cloudformation describe-stacks \
  --stack-name plantuml-renderer-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`RendererApiUrl`].OutputValue' \
  --output text)
echo "Development API URL: $DEV_URL"
```

### 5. Configure and Deploy Forge App
```bash
cd ../apps/forge-plantuml

# Set Forge credentials
export FORGE_EMAIL="your-email@example.com"
export FORGE_API_TOKEN="your-forge-api-token"

# Login to Forge
npx @forge/cli login

# Get JWT secrets
DEV_SECRET=$(aws ssm get-parameter \
  --name "/plantuml/renderer/jwt-secret-dev" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text)

# Set Forge environment variables
npx @forge/cli variables set RENDERER_JWT_SECRET "$DEV_SECRET" --environment development
npx @forge/cli variables set RENDERER_URL "$DEV_URL" --environment development

# Deploy to development
npx @forge/cli deploy --environment development

# Install in your Confluence instance
npx @forge/cli install --product confluence --environment development
```

### 6. Test the Installation
1. Open your Confluence Cloud instance
2. Create or edit a page
3. Type `/` and search for "PlantUML"
4. Add the PlantUML macro
5. Enter test diagram:
   ```
   @startuml
   Alice -> Bob: Hello
   Bob -> Alice: Hi there!
   @enduml
   ```
6. Save and verify the diagram renders

## 🔧 Production Deployment (Optional)

For production use:

```bash
# Deploy renderer to production
cd services/renderer
sam deploy --config-env prod

# Get production URL
PROD_URL=$(aws cloudformation describe-stacks \
  --stack-name plantuml-renderer-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`RendererApiUrl`].OutputValue' \
  --output text)

# Configure Forge for production
cd ../apps/forge-plantuml
PROD_SECRET=$(aws ssm get-parameter \
  --name "/plantuml/renderer/jwt-secret-prod" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text)

npx @forge/cli variables set RENDERER_JWT_SECRET "$PROD_SECRET" --environment production
npx @forge/cli variables set RENDERER_URL "$PROD_URL" --environment production
npx @forge/cli deploy --environment production
npx @forge/cli install --product confluence --environment production
```

## 🚫 Troubleshooting

### Common Issues

**"Export already exists" error during SAM deploy:**
```bash
# Delete existing stack if needed
aws cloudformation delete-stack --stack-name plantuml-renderer-dev
# Wait for deletion, then retry sam deploy
```

**"JWT verification failed":**
- Ensure JWT secrets match between AWS SSM and Forge variables
- Check `npx @forge/cli variables list --environment development`

**"Renderer URL not found":**
- Verify SAM deployment succeeded
- Check CloudFormation outputs: `aws cloudformation describe-stacks --stack-name plantuml-renderer-dev`

**Forge CLI login issues:**
- Use `npx @forge/cli logout` then `npx @forge/cli login`
- Verify API token is correct

## 📚 Next Steps

- **Development**: See [DEVELOPMENT.md](./DEVELOPMENT.md) for local development setup
- **Security**: See [SECURITY.md](./SECURITY.md) for security considerations
- **CI/CD**: See [docs/GITHUB_SETUP.md](./docs/GITHUB_SETUP.md) for automated deployments
- **Issues**: Check troubleshooting section in [DEVELOPMENT.md](./DEVELOPMENT.md)

## 📊 Performance Notes

- **First request**: ~5s (Lambda cold start)
- **Subsequent requests**: ~1-2s (warm Lambda)
- **Auth caching**: 1 hour (near-zero auth overhead)
- **Diagram caching**: Persistent in Forge storage

---

**Need help?** Check [DEVELOPMENT.md](./DEVELOPMENT.md) or create an issue in the repository.