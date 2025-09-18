# Setup Guide

Complete setup guide for PlantUML Confluence Cloud App - local development, development environment, and production deployment.

## 🚀 Automated Setup (Recommended)

For new users, use our automated setup script:

```bash
git clone <repository-url>
cd plant-uml-confluence
./scripts/setup.sh
```

This script will:

- ✅ Check prerequisites
- ✅ Install dependencies
- ✅ Configure AWS credentials
- ✅ Create JWT secrets
- ✅ Deploy AWS Lambda services
- ✅ Configure and deploy Forge app
- ✅ Run health checks

**Continue reading for manual setup or troubleshooting.**

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

### Verify Prerequisites

```bash
# Check versions
java -version        # Should be 11+
node --version       # Should be 18+
aws --version        # Should be 2.0+
sam --version        # Should be 1.0+
forge --version      # Should be latest

# Check AWS credentials
aws sts get-caller-identity
```

## 🔧 Manual Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd plant-uml-confluence
npm install
```

### 2. Configure AWS Environment

```bash
# Set your preferred AWS region
export AWS_DEFAULT_REGION=eu-north-1

# Verify AWS CLI is configured
aws sts get-caller-identity
```

### 3. Create JWT Secrets

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

### 4. Deploy AWS Lambda Services

#### Development Environment

```bash
cd services/renderer
sam build
sam deploy --config-env dev

# Get the API endpoint URL
DEV_URL=$(aws cloudformation describe-stacks \
  --stack-name plantuml-renderer-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`RendererApiUrl`].OutputValue' \
  --output text)
echo "Development API URL: $DEV_URL"
```

#### Production Environment

```bash
sam deploy --config-env prod

# Get the API endpoint URL
PROD_URL=$(aws cloudformation describe-stacks \
  --stack-name plantuml-renderer-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`RendererApiUrl`].OutputValue' \
  --output text)
echo "Production API URL: $PROD_URL"
```

### 5. Configure Forge CLI

```bash
# Set your Forge credentials
export FORGE_EMAIL="your-email@example.com"
export FORGE_API_TOKEN="your-forge-api-token"

# Login to Forge
forge login --email "$FORGE_EMAIL" --token "$FORGE_API_TOKEN"
```

**Get Forge API Token:**

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Create new token with label "PlantUML Development"
3. Copy the token value

### 6. Deploy Forge App

#### Development Environment

```bash
cd apps/forge-plantuml

# Get JWT secret
DEV_SECRET=$(aws ssm get-parameter \
  --name "/plantuml/renderer/jwt-secret-dev" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text)

# Set Forge environment variables
forge variables set RENDERER_JWT_SECRET "$DEV_SECRET" --environment development
forge variables set RENDERER_URL "$DEV_URL" --environment development

# Deploy to development
forge deploy --environment development --non-interactive --no-verify

# Install in your Confluence instance
forge install --product confluence --environment development
```

#### Production Environment

```bash
# Get JWT secret
PROD_SECRET=$(aws ssm get-parameter \
  --name "/plantuml/renderer/jwt-secret-prod" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text)

# Set Forge environment variables
forge variables set RENDERER_JWT_SECRET "$PROD_SECRET" --environment production
forge variables set RENDERER_URL "$PROD_URL" --environment production

# Deploy to production
forge deploy --environment production --non-interactive --no-verify

# Install in your Confluence instance
forge install --product confluence --environment production
```

## 🧪 Local Development Setup

### 1. Start Local Renderer

```bash
cd services/renderer
sam build
sam local start-api --port 3001

# In another terminal, test the endpoint
curl http://localhost:3001/health
```

### 2. Configure Forge for Local Development

```bash
cd apps/forge-plantuml

# Set local development variables
forge variables set RENDERER_URL "http://localhost:3001" --environment development
forge variables set RENDERER_JWT_SECRET "dev-secret" --environment development

# Deploy and start tunnel
forge deploy --environment development
forge tunnel
```

**Note**: In local development, JWT authentication is bypassed when `NODE_ENV=development`.

## ✅ Verification & Testing

### 1. Health Check

```bash
# Test development environment
curl https://your-dev-api-url/health

# Test production environment
curl https://your-prod-api-url/health

# Expected response:
# {"status":"healthy","timestamp":"2025-01-15T10:30:00.000Z"}
```

### 2. Test Forge App

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

### 3. Run Automated Tests

```bash
# Run all tests
npm test

# Run smoke tests
./scripts/health-check.sh

# Run integration tests
cd services/renderer
./test-loop.sh
```

## 🔧 Configuration Reference

### Environment Variables

#### AWS Lambda Environment Variables

- `NODE_ENV`: Set to "development" to skip JWT validation
- `JWT_SECRET_PARAM`: SSM parameter path for JWT secret
- `GRAPHVIZ_DOT`: Path to Graphviz binary (`/opt/bin/dot`)
- `PLANTUML_JAR`: Path to PlantUML JAR (`/opt/plantuml.jar`)

#### Forge App Environment Variables

- `RENDERER_URL`: API Gateway endpoint URL
- `RENDERER_JWT_SECRET`: Shared JWT secret for token generation

### Stack Names and URLs

| Environment     | Stack Name               | Example URL                                                |
| --------------- | ------------------------ | ---------------------------------------------------------- |
| **Development** | `plantuml-renderer-dev`  | `https://abc123.execute-api.eu-north-1.amazonaws.com/dev`  |
| **Production**  | `plantuml-renderer-prod` | `https://xyz789.execute-api.eu-north-1.amazonaws.com/prod` |

## 🚫 Troubleshooting

### Common Issues

#### "Export already exists" CloudFormation Error

```bash
# Check existing stacks
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE

# Delete conflicting stack if needed
aws cloudformation delete-stack --stack-name plantuml-renderer-dev
# Wait for deletion, then retry deployment
```

#### "JWT verification failed"

1. **Local development**: Ensure `NODE_ENV=development` is set
2. **Production**: Check JWT secrets match between AWS SSM and Forge:

   ```bash
   # Check AWS SSM
   aws ssm get-parameter --name "/plantuml/renderer/jwt-secret-dev"

   # Check Forge variables
   forge variables list --environment development
   ```

#### "Forge CLI login issues"

```bash
# Logout and login again
forge logout
forge login --email "$FORGE_EMAIL" --token "$FORGE_API_TOKEN"

# Verify API token is correct at:
# https://id.atlassian.com/manage-profile/security/api-tokens
```

#### "SAM deploy failed"

```bash
# Validate template
sam validate --template template.yaml

# Check configuration
cat samconfig.toml

# Use specific config environment
sam deploy --config-env dev  # not --guided
```

#### "PlantUML rendering timeout"

- Check Lambda memory allocation (256MB recommended)
- Verify PlantUML layer deployment
- Check CloudWatch logs for detailed errors

### Debug Commands

```bash
# Check Lambda logs
sam logs --name plantuml-renderer-dev --tail

# Check Forge app logs
cd apps/forge-plantuml
forge logs --tail

# Check CloudFormation stack
aws cloudformation describe-stacks --stack-name plantuml-renderer-dev

# Test local SAM API
cd services/renderer
sam local start-api --port 3001
```

## 🔄 CI/CD Setup

### GitHub Actions Configuration

The project includes automated CI/CD workflows:

- **Development**: Auto-deploys on push to `develop` branch
- **Production**: Manual deployment via GitHub Actions

#### Required GitHub Secrets

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Forge Credentials
FORGE_EMAIL=your-email@example.com
FORGE_API_TOKEN=your-api-token
```

#### Required GitHub Variables

```bash
AWS_REGION=eu-north-1
RENDERER_URL_DEV=https://your-dev-api-url
RENDERER_URL_PROD=https://your-prod-api-url
```

See [docs/GITHUB_SETUP.md](./docs/GITHUB_SETUP.md) for detailed CI/CD setup.

## 📚 Next Steps

After successful setup:

1. **Development**: See [DEVELOPMENT.md](./DEVELOPMENT.md) for development workflow
2. **Security**: Review [SECURITY.md](./SECURITY.md) for security considerations
3. **Contributing**: Check [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines
4. **Production**: Plan your production deployment and monitoring strategy

## 💡 Performance Tips

- **Memory Allocation**: 256MB is cost-optimized, increase to 512MB for faster cold starts
- **Warmup**: Consider EventBridge warmup for production (adds ~$1/month)
- **Caching**: Leverage Forge storage caching and API Gateway auth caching
- **Monitoring**: Set up CloudWatch alarms for error rates and performance

---

**Need help?** Check [DEVELOPMENT.md](./DEVELOPMENT.md) for troubleshooting or create an issue.
