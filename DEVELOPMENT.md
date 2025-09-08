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

# Render diagram (requires JWT)
curl -X POST http://localhost:3001/render \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{"source":"@startuml\nAlice -> Bob: Hello\n@enduml","format":"svg"}'
```

## 🔧 Configuration

### Environment Variables

- `JWT_SECRET_PARAM`: SSM parameter path for JWT secret
- `NODE_ENV`: Set to "development" to skip JWT validation
- `GRAPHVIZ_DOT`: Path to Graphviz binary (from layer)
- `PLANTUML_JAR`: Path to PlantUML JAR (from layer)

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

#### "Cold start too slow"
- SnapStart is enabled in template.yaml
- Check Lambda memory allocation (1024MB recommended)

#### "JWT verification failed"
- Verify JWT secret in SSM Parameter Store
- Check NODE_ENV=development for local testing

#### "PlantUML rendering failed"
- Check PlantUML layer deployment
- Verify Java 11 runtime configuration

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

- **SnapStart**: Reduces cold start from ~6s to ~1-2s
- **Memory**: 1024MB for faster initialization
- **Caching**: Hash-based SVG caching in Forge storage
- **Architecture**: x86_64 for compatibility

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
- JWT HS256 authentication
- SVG output format

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