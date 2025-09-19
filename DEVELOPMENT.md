# Development Guide

Complete guide for developing, testing, and deploying the PlantUML Confluence app.

## 🚀 Quick Setup

**New to the project?** Start with [SETUP.md](./SETUP.md), then return here for development.

## 🏗️ Development Environment

### Prerequisites

- **Java 11+** (for renderer development)
- **Node.js 20+** and npm 8+
- **AWS CLI** configured with appropriate permissions
- **AWS SAM CLI** installed and working
- **Docker** (for SAM local testing)
- **Forge CLI**: `npm install -g @forge/cli`

### Environment Setup

```bash
# Automated setup (recommended)
./scripts/setup.sh

# Or manual setup
npm install
```

## 🏗️ Architecture Overview

### Current Architecture (Node.js Lambda Authorizer)

```
Request → API Gateway → Node.js Auth (100ms) → Java Renderer (5s)
                     ↓
                  Cached 1hr (0ms)
```

### Components

1. **Forge App** (`apps/forge-plantuml/`)
   - React-based macro UI with configuration dialog
   - Cache reset checkbox functionality
   - SVG diagram display with error handling
   - JWT token generation and API calls

2. **Renderer Service** (`services/renderer/`)
   - **Java Lambda**: PlantUML rendering (256MB, ~5s cold start)
   - **Node.js Authorizer**: JWT validation (128MB, ~100ms cold start)
   - **API Gateway**: HTTP API with 1-hour auth caching
   - **Lambda Layer**: PlantUML JAR and Graphviz binaries

### File Structure

```
plant-uml-confluence/
├── apps/forge-plantuml/           # Atlassian Forge app
│   ├── src/
│   │   ├── index.js              # Backend resolvers
│   │   ├── frontend/index.jsx    # React UI components
│   │   └── macro-config.jsx      # Configuration dialog
│   ├── manifest.yml              # Forge app manifest
│   └── package.json              # Forge dependencies
├── services/renderer/             # AWS Lambda renderer
│   ├── src/main/java/com/plantuml/
│   │   └── Handler.java          # PlantUML renderer logic
│   ├── authorizer/
│   │   ├── index.js              # Node.js JWT authorizer
│   │   └── package.json          # Node.js dependencies
│   ├── layers/plantuml-layer/    # PlantUML JAR + Graphviz
│   ├── pom.xml                   # Java dependencies
│   ├── template.yaml             # SAM CloudFormation template
│   ├── samconfig.toml            # SAM deployment configuration
│   └── test-loop.sh              # Local testing script
├── .github/workflows/            # CI/CD pipelines
├── docs/                         # Additional documentation
└── scripts/                      # Utility scripts
```

## 🧪 Local Development

### 1. Local Development

```bash
# Start local renderer (keeps running)
./scripts/dev.sh

# In another terminal, start Forge tunnel
cd apps/forge-plantuml
forge tunnel

# Test endpoints
curl http://localhost:3001/health
./scripts/health-check.sh
```

**Note**: In local development (`NODE_ENV=development`), JWT authentication is bypassed.

### 2. Quick Deployment

```bash
# Deploy to development
./scripts/deploy-dev.sh

# Deploy to production (with confirmation)
./scripts/deploy-prod.sh

# Health check all environments
./scripts/health-check.sh
```

### 3. Testing

```bash
# Run all tests
npm test

# Run smoke tests
./scripts/health-check.sh

# Run integration tests
cd services/renderer
./test-loop.sh
```

## 🔧 Configuration

### Environment Variables

#### Renderer Lambda Environment Variables

- `NODE_ENV`: Set to "development" to skip JWT validation
- `JWT_SECRET_PARAM`: SSM parameter path for JWT secret
- `GRAPHVIZ_DOT`: Path to Graphviz binary (`/opt/bin/dot`)
- `PLANTUML_JAR`: Path to PlantUML JAR (`/opt/plantuml.jar`)

#### Forge App Environment Variables

- `RENDERER_URL`: API Gateway endpoint URL
- `RENDERER_JWT_SECRET`: Shared JWT secret for token generation

### JWT Secret Configuration

**Critical**: Each environment must have matching secrets between AWS SSM and Forge.

#### 1. Create AWS SSM Parameters

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

#### 2. Configure Forge Environment Variables

```bash
# Get the actual secret values
DEV_SECRET=$(aws ssm get-parameter \
  --name "/plantuml/renderer/jwt-secret-dev" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text)
PROD_SECRET=$(aws ssm get-parameter \
  --name "/plantuml/renderer/jwt-secret-prod" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text)

# Get renderer API URLs
DEV_URL=$(aws cloudformation describe-stacks \
  --stack-name plantuml-renderer-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`RendererApiUrl`].OutputValue' \
  --output text)
PROD_URL=$(aws cloudformation describe-stacks \
  --stack-name plantuml-renderer-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`RendererApiUrl`].OutputValue' \
  --output text)

# Set in Forge environments
cd apps/forge-plantuml

# Development environment
npx @forge/cli variables set RENDERER_JWT_SECRET "$DEV_SECRET" --environment development
npx @forge/cli variables set RENDERER_URL "$DEV_URL" --environment development

# Production environment
npx @forge/cli variables set RENDERER_JWT_SECRET "$PROD_SECRET" --environment production
npx @forge/cli variables set RENDERER_URL "$PROD_URL" --environment production

# Deploy to both environments
npx @forge/cli deploy --environment development
npx @forge/cli deploy --environment production
```

### Cache Reset Feature

Users can reset diagram cache through the macro configuration:

- **Checkbox**: "Reset cache"
- **Help text**: "Check this only if the diagram appears broken or outdated"
- **Backend**: Handles `resetCache` flag to clear Forge storage

## 🚀 Deployment

### Development Deployment (Automated)

Development deploys automatically on push to `develop` branch via GitHub Actions.

**Manual development deployment:**

```bash
# Deploy renderer
cd services/renderer
sam build
sam deploy --config-env dev

# Deploy Forge app
cd ../apps/forge-plantuml
npx @forge/cli deploy --environment development
```

### Production Deployment (Manual)

Production requires manual approval via GitHub Actions or manual deployment.

**Manual production deployment:**

```bash
# Deploy renderer to production
cd services/renderer
sam deploy --config-env prod

# Deploy Forge app to production
cd ../apps/forge-plantuml
npx @forge/cli deploy --environment production
npx @forge/cli install --product confluence --environment production
```

### Deployment Environments

| Environment     | Stack Name               | Auto-Deploy            | Purpose         |
| --------------- | ------------------------ | ---------------------- | --------------- |
| **Development** | `plantuml-renderer-dev`  | ✅ On `develop` branch | Feature testing |
| **Production**  | `plantuml-renderer-prod` | 🔒 Manual approval     | Live users      |

## 🐛 Troubleshooting

### Common Issues

#### "Export already exists" CloudFormation Error

```bash
# Check existing stacks
aws cloudformation list-stacks \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
  --query 'StackSummaries[?contains(StackName, `plantuml`)].{Name:StackName,Status:StackStatus}' \
  --output table

# Delete conflicting stack if needed
aws cloudformation delete-stack --stack-name plantuml-renderer
# Wait for deletion, then retry deployment
```

#### "Cold start too slow (>8s)"

Current performance: ~5s cold start with 256MB memory allocation.

**Troubleshooting steps:**

```bash
# Check SnapStart status
aws lambda get-function --function-name plantuml-renderer-prod \
  --query 'Configuration.SnapStart'

# Check if alias exists and points to correct version
aws lambda get-alias --function-name plantuml-renderer-prod --name live

# Check CloudWatch logs for INIT_START vs RESTORE_START
aws logs filter-log-events \
  --log-group-name /aws/lambda/plantuml-renderer-prod \
  --filter-pattern "INIT_START" \
  --start-time $(date -d '1 hour ago' +%s)000
```

**Expected behavior:**

- First invocation: `INIT_START` (cold start ~8s)
- Subsequent invocations: `RESTORE_START` (SnapStart ~5s)

**If SnapStart OptimizationStatus is "Off":**

```bash
# Publish new version
aws lambda publish-version --function-name plantuml-renderer-prod

# Check/create alias
aws lambda get-alias --function-name plantuml-renderer-prod --name live

# If alias doesn't exist, create it
aws lambda create-alias \
  --function-name plantuml-renderer-prod \
  --name live \
  --function-version $LATEST_VERSION

# Redeploy SAM to use alias
sam deploy --config-env prod

# Wait 5-10 minutes for SnapStart optimization
```

#### "JWT verification failed"

**Local development:**

- Ensure `NODE_ENV=development` is set (JWT validation skipped)

**Production:**

1. Check JWT secret exists in SSM:
   ```bash
   aws ssm get-parameter --name "/plantuml/renderer/jwt-secret-prod"
   ```
2. Verify Forge has same secret:
   ```bash
   npx @forge/cli variables list --environment production
   ```
3. Ensure both secrets match exactly

#### "PlantUML rendering failed"

- Check PlantUML layer deployment in CloudFormation
- Verify Java 11 runtime configuration
- Check CloudWatch logs for detailed error messages

#### "SAM deploy failed - S3 bucket not specified"

- Use `sam deploy --config-env prod` (not `--guided`)
- Check `samconfig.toml` has correct configuration
- Remove any incorrectly created config files

### Debug Commands

```bash
# Check Lambda logs (real-time)
sam logs --name plantuml-renderer-dev --tail

# Test local SAM API
cd services/renderer
sam local start-api --port 3001

# Check Forge app logs
cd apps/forge-plantuml
npx @forge/cli logs --tail

# Validate SAM template
sam validate --template template.yaml

# Check CloudFormation stack status
aws cloudformation describe-stacks --stack-name plantuml-renderer-dev
```

## 📊 Performance

### Current Performance Profile

- **Memory Allocation**: 256MB (Java renderer), 128MB (Node.js authorizer)
- **Actual Memory Usage**: ~140MB (Java renderer)
- **Cold Start**: ~5s (Java renderer), ~100ms (Node.js authorizer)
- **Warm Requests**: ~1-2s (rendering), ~0ms (cached auth)
- **Auth Caching**: 1 hour TTL (3600 seconds)

### Performance Optimizations Applied

- **Node.js Authorizer**: Fast JWT validation with API Gateway caching
- **Java Renderer**: SnapStart reduces cold start from ~8s to ~5s
- **Memory Optimization**: Right-sized to 256MB (vs 1024MB default)
- **API Gateway Caching**: Auth decisions cached for 1 hour
- **SVG Caching**: Hash-based caching in Forge storage
- **Architecture**: x86_64 for compatibility

### Performance Flow

```
Request → API Gateway → Node.js Auth (100ms) → Java Renderer (5s)
                     ↓
                  Cached 1hr (0ms)
```

### Cold Start Optimization Options

**Current Performance**: 5s cold start, 140MB memory usage, 256MB allocated

**Future Improvements** (when you have active clients):

1. **Memory Increase**: 512MB or 1024MB for faster initialization (~4s cold start)
2. **Warmup Schedule**: EventBridge rule every 4min during business hours (~$1/month)
3. **Provisioned Concurrency**: 1-2 warm instances (0s cold start, ~$25/month)
4. **Container Image**: Better optimization control (medium effort)
5. **GraalVM Native**: Sub-second starts (high effort, compatibility risk)

**Recommendation**: Current 256MB allocation is cost-optimized. Consider warmup when you have regular users.

### Storage Limits

- **Forge Storage**: 1GB per client (Confluence instance)
- **Capacity**: ~5,000-10,000 unique diagrams per client
- **Future**: Can migrate to S3 if needed

## 🤝 Contributing

### Development Workflow

1. **Create feature branch** from `develop`
2. **Make changes** and test locally
3. **Create PR to `develop`** (triggers auto-deploy to dev)
4. **Test in dev environment**
5. **Create PR to `main`** for production
6. **Manual approval** and deploy to production

### Code Standards

- **Java 11** with Maven for renderer service
- **React** with Forge UI Kit components for frontend
- **JWT HS256** authentication with 60s TTL
- **SVG output** format for diagrams
- **Secrets** stored in AWS SSM Parameter Store
- **ESLint + Prettier** for code formatting
- **Conventional Commits** for commit messages

### Branch Strategy

```
feature/* → develop (auto-deploy dev) → main (manual deploy prod)
```

## 🚀 CI/CD Pipeline

### GitHub Actions Workflows

- **PR Checks** (`pr-checks.yml`): Lint, test, validate on pull requests
- **Deploy Development** (`deploy-development.yml`): Auto-deploy to dev on `develop` branch
- **Deploy Production** (`deploy-production.yml`): Manual deploy to prod on `main` branch

### Required GitHub Secrets

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Forge Credentials
FORGE_EMAIL=your-email@example.com
FORGE_API_TOKEN=your-api-token

# Environment Variables
AWS_REGION=eu-north-1
RENDERER_URL_DEV=https://dev-api.execute-api.region.amazonaws.com/dev
RENDERER_URL_PROD=https://prod-api.execute-api.region.amazonaws.com/prod
```

### Cost Optimization

- **Triggers**: Only on relevant file changes
- **Simple Tests**: Health endpoint validation
- **Expected Cost**: ~$2-10/month with CI/CD

See [docs/GITHUB_SETUP.md](./docs/GITHUB_SETUP.md) for detailed CI/CD setup.

## 🔐 Security Maintenance

### JWT Secret Rotation

Rotate JWT secrets periodically for security (rotate each environment separately):

```bash
# Rotate PRODUCTION secret
PROD_SECRET=$(openssl rand -base64 32)
aws ssm put-parameter \
  --name "/plantuml/renderer/jwt-secret-prod" \
  --value "$PROD_SECRET" \
  --type "SecureString" \
  --overwrite

cd apps/forge-plantuml
npx @forge/cli variables set RENDERER_JWT_SECRET "$PROD_SECRET" --environment production
npx @forge/cli deploy --environment production

# Rotate DEVELOPMENT secret (separate operation)
DEV_SECRET=$(openssl rand -base64 32)
aws ssm put-parameter \
  --name "/plantuml/renderer/jwt-secret-dev" \
  --value "$DEV_SECRET" \
  --type "SecureString" \
  --overwrite

npx @forge/cli variables set RENDERER_JWT_SECRET "$DEV_SECRET" --environment development
npx @forge/cli deploy --environment development
```

**Benefits of separate secrets:**

- Production compromise doesn't affect development
- Can rotate environments independently
- Better security isolation
- Easier troubleshooting

### Security Best Practices

- **Environment Isolation**: Separate AWS accounts/regions for prod
- **Least Privilege**: IAM roles with minimal required permissions
- **Secret Management**: Never commit secrets to version control
- **JWT TTL**: Keep token lifetime short (60 seconds)
- **CORS**: Restrict to Atlassian domains only
- **Monitoring**: CloudWatch alerts for unusual activity

## 📚 Additional Resources

- **Atlassian Forge**: https://developer.atlassian.com/platform/forge/
- **AWS SAM**: https://docs.aws.amazon.com/serverless-application-model/
- **PlantUML**: https://plantuml.com/
- **JWT**: https://jwt.io/

---

**Need help?** Create an issue in the repository or check the troubleshooting section above.
