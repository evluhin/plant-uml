# Development Guide

## 🚀 Quick Setup

See [QUICKSTART.md](./QUICKSTART.md) for initial setup, then return here for development.

## 🏗️ Development Environment

### Prerequisites
- Java 11+ (for renderer development)
- Node.js 18+ and npm 8+
- AWS CLI configured
- AWS SAM CLI installed

## 🏗️ Architecture

### Components

1. **Forge App** (`apps/forge-plantuml/`)
   - React-based macro UI
   - Cache reset checkbox in configuration
   - SVG diagram display

2. **Renderer Service** (`services/renderer/`)
   - Java 11 AWS Lambda with SnapStart
   - PlantUML Maven dependency
   - JWT authentication
   - ~1-2s cold start time

### File Structure

```
services/renderer/
├── src/main/java/com/plantuml/
│   └── Handler.java           # Lambda handler
├── pom.xml                    # Maven dependencies
├── template.yaml              # SAM template with SnapStart
└── test-loop.sh              # Local testing script

apps/forge-plantuml/
├── src/
│   ├── index.js              # Backend resolvers
│   ├── frontend/index.jsx    # React UI
│   └── macro-config.jsx      # Configuration dialog
└── manifest.yml              # Forge app manifest
```

## 🧪 Testing

### Local Renderer Testing

```bash
cd services/renderer
bash test-loop.sh
```

### Manual API Testing

```bash
# Health check
curl http://localhost:3001/health

# Render diagram (no JWT needed in development)
curl -X POST http://localhost:3001/render \
  -H "Content-Type: application/json" \
  -d '{"source":"@startuml\nAlice -> Bob: Hello\n@enduml","format":"svg"}'
```

## 🔧 Configuration

### Environment Variables

- `NODE_ENV`: Set to "development" to skip JWT validation (for local testing)
- `JWT_SECRET_PARAM`: SSM parameter path for JWT secret (production only)
- `GRAPHVIZ_DOT`: Path to Graphviz binary (from layer)
- `PLANTUML_JAR`: Path to PlantUML JAR (from layer)

(see renderer Lambda function env variables)

### JWT Secret Configuration

For production, you need a shared secret between Forge app and Lambda:

**1. Create secret in AWS SSM Parameter Store:**
```bash
# Generate and store secret
aws ssm put-parameter \
  --name "/plantuml/renderer/jwt-secret" \
  --value "$(openssl rand -base64 32)" \
  --type "SecureString" \
  --description "JWT secret for PlantUML renderer"
```

**2. Set same secret in Forge app:**
```bash
# Set environment variable in Forge
cd apps/forge-plantuml
npx @forge/cli environment set RENDERER_JWT_SECRET "<same-secret-value>"
npx @forge/cli deploy
```

**Note**: In development mode (`NODE_ENV=development`), JWT authentication is bypassed for easier local testing.

### Cache Reset Feature

Users can reset diagram cache through the macro configuration:
- Checkbox: "Reset cache"
- Help text: "Check this only if the diagram appears broken or outdated"
- Backend handles `resetCache` flag to clear Forge storage

## 🚀 Deployment

### Simple Deployment

```bash
./deploy.sh
```

### Manual Deployment

```bash
# 1. Deploy renderer
cd services/renderer
sam build
sam deploy

# 2. Deploy Forge app
cd ../apps/forge-plantuml
npx @forge/cli deploy
```

### Production Deployment

```bash
# Deploy to production environment
cd services/renderer
sam deploy --config-env prod

cd ../apps/forge-plantuml
npx @forge/cli deploy --environment production
npx @forge/cli install --product confluence --environment production
```

## 🐛 Troubleshooting

### Common Issues

#### "Cold start too slow (>5s)"
- **Check SnapStart status**: 
  ```bash
  aws lambda get-function --function-name plantuml-renderer-prod
  # Look for "SnapStart": {"ApplyOn": "PublishedVersions", "OptimizationStatus": "On"}
  ```
- **Verify alias is being used**:
  ```bash
  aws lambda get-alias --function-name plantuml-renderer-prod --name live
  ```
- **Check CloudWatch logs** for "INIT_START" vs "RESTORE_START"
- **Force new version**: Redeploy to trigger SnapStart optimization
- **Memory allocation**: Ensure 1024MB+ for faster initialization

#### "JWT verification failed"
- **Local development**: Ensure `NODE_ENV=development` is set (JWT validation skipped)
- **Production**: 
  1. Check JWT secret exists in SSM: `aws ssm get-parameter --name "/plantuml/renderer/jwt-secret"`
  2. Verify Forge has same secret: `npx @forge/cli environment list`
  3. Ensure both secrets match exactly

#### "PlantUML rendering failed"
- Check PlantUML layer deployment
- Verify Java 11 runtime configuration

#### "SAM deploy failed - S3 bucket not specified"
- Use `sam deploy --config-env prod` (not --guided)
- Check samconfig.toml has correct prod configuration
- If guided setup created wrong files, delete them and use existing config

#### "SAM config file extension not supported"
- Remove any incorrectly created config files (like file named 'y')
- Use only samconfig.toml for configuration

### Debug Commands

```bash
# Check Lambda logs
sam logs --name plantuml-renderer-dev --tail

# Test local SAM
cd services/renderer
sam local start-api --port 3001
```

## 📊 Performance

### Optimizations Applied

- **SnapStart**: Reduces cold start from ~6s to ~1-2s (when working)
- **Memory**: 1024MB for faster initialization
- **Caching**: Hash-based SVG caching in Forge storage
- **Architecture**: x86_64 for compatibility

### SnapStart Troubleshooting

If cold starts are still >5s, SnapStart may not be working:

```bash
# Check SnapStart status
aws lambda get-function --function-name plantuml-renderer-prod \
  --query 'Configuration.SnapStart'

# Check if alias exists and points to correct version
aws lambda get-alias --function-name plantuml-renderer-prod --name live

# Check recent invocations in CloudWatch logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/plantuml-renderer-prod \
  --filter-pattern "INIT_START" \
  --start-time $(date -d '1 hour ago' +%s)000
```

**Expected behavior:**
- First invocation: `INIT_START` (cold start ~6s)
- Subsequent invocations: `RESTORE_START` (SnapStart ~1-2s)

**If SnapStart OptimizationStatus is "Off":**
1. **Publish new version**:
   ```bash
   aws lambda publish-version --function-name plantuml-renderer-prod
   ```
2. **Check/create alias**:
   ```bash
   # Check if alias exists
   aws lambda get-alias --function-name plantuml-renderer-prod --name live
   
   # If not exists, create it (replace VERSION with actual version number)
   aws lambda create-alias \
     --function-name plantuml-renderer-prod \
     --name live \
     --function-version VERSION
   ```
3. **Redeploy SAM to use alias**:
   ```bash
   sam deploy --config-env prod
   ```
4. **Wait 5-10 minutes** for SnapStart optimization
5. **Verify status changed to "On"**:
   ```bash
   aws lambda get-function --function-name plantuml-renderer-prod \
     --query 'Configuration.SnapStart.OptimizationStatus'
   ```

### Storage Limits

- **Forge Storage**: 1GB per client (Confluence instance)
- **Capacity**: ~5,000-10,000 unique diagrams per client
- **Future**: Can migrate to S3 if needed

## 🤝 Contributing

### Development Workflow

1. Create feature branch from `develop`
2. Make changes and test locally
3. Create PR to `develop` (triggers auto-deploy to dev)
4. Test in dev environment
5. Create PR to `main` for production
6. Manual approval and deploy to production

### Code Standards

- Java 11 with Maven
- React with Forge UI Kit components
- JWT HS256 authentication with 60s TTL
- SVG output format
- Secrets stored in AWS SSM Parameter Store

## 🚀 CI/CD Pipeline

### GitHub Actions Workflows
- **PR Checks**: Lint, test, validate on pull requests
- **Deploy Development**: Auto-deploy to dev on `develop` branch
- **Deploy Production**: Manual deploy to prod on `main` branch

### Required GitHub Secrets
```bash
# AWS
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Forge
FORGE_EMAIL=your-email@example.com
FORGE_API_TOKEN=your-api-token

# Variables
AWS_REGION=eu-north-1
RENDERER_URL_DEV=https://dev-api.execute-api.region.amazonaws.com/dev
RENDERER_URL_PROD=https://prod-api.execute-api.region.amazonaws.com/prod
```

### Branch Strategy
```
feature/* → develop (auto-deploy dev) → main (manual deploy prod)
```

### Cost Optimization
- Triggers only on relevant file changes
- Simple smoke tests (health endpoint)
- Expected cost: ~$2-10/month

See [docs/GITHUB_SETUP.md](./docs/GITHUB_SETUP.md) for detailed setup.

## 🔐 Security Maintenance

### JWT Secret Rotation

Rotate JWT secret periodically for security:

```bash
# 1. Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# 2. Update AWS SSM parameter
aws ssm put-parameter \
  --name "/plantuml/renderer/jwt-secret" \
  --value "$NEW_SECRET" \
  --type "SecureString" \
  --overwrite

# 3. Update Forge app
cd apps/forge-plantuml
npx @forge/cli environment set RENDERER_JWT_SECRET "$NEW_SECRET"
npx @forge/cli deploy

# 4. Verify both services use new secret
echo "Lambda will pick up new secret on next cold start"
echo "Forge app updated immediately after deploy"
```