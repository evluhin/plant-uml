# Development Guide

## 🚀 Quick Start

### 1. Setup Development Environment

```bash
# Install dependencies
npm install

# Setup renderer for local development
cd services/renderer
bash dev-setup.sh

# Test everything works
npm run test:local
```

### 2. Start Development Servers

```bash
# Terminal 1: Renderer with hot reload
cd services/renderer
npm run dev     # TypeScript watch mode

# Terminal 2: SAM Local API
cd services/renderer  
npm run local   # Starts on http://localhost:3001

# Terminal 3: Forge app development
cd apps/forge-plantuml
npm run dev     # TypeScript watch mode
npx @forge/cli tunnel  # Connects to Confluence
```

## 🧪 Testing

### Local Testing

```bash
# Test renderer locally
cd services/renderer
npm run test:local

# Run unit tests
npm run test

# Run integration tests
npm run test:integration
```

### Manual Testing

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test SVG rendering
curl -X POST http://localhost:3001/render \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "source": "@startuml\nAlice -> Bob: Hello\n@enduml",
    "format": "svg"
  }'
```

## 🏗️ Architecture

### Development vs Production

| Component | Development | Production |
|-----------|-------------|------------|
| **JWT Auth** | Mock (bypassed) | Real SSM + verification |
| **PlantUML** | Mock SVG/PNG | Real JAR + Graphviz |
| **Storage** | In-memory | AWS Lambda layers |
| **Logs** | Console | CloudWatch |

### File Structure

```
services/renderer/
├── src/
│   ├── handlers/
│   │   ├── render.ts      # Main PlantUML handler
│   │   └── health.ts      # Health check
│   ├── utils/
│   │   ├── jwt-mock.ts    # Development JWT bypass
│   │   ├── plantuml-mock.ts # Development PlantUML mock
│   │   ├── jwt.ts         # Production JWT verification
│   │   └── plantuml.ts    # Production PlantUML rendering
│   └── types/
├── layers/plantuml-layer/ # PlantUML JAR + Graphviz
├── tests/
├── dev-setup.sh          # Development setup script
├── test-local.sh         # Local testing script
└── template.yaml         # SAM template
```

## 🔧 Configuration

### Environment Variables

#### Development (.env.local)
```json
{
  "RendererFunction": {
    "JWT_SECRET_PARAM": "/test/secret",
    "NODE_ENV": "development",
    "AWS_REGION": "us-east-1"
  }
}
```

#### Production
```bash
JWT_SECRET_PARAM=/plantuml/renderer/jwt-secret
NODE_ENV=production
LOG_PAYLOADS=false
```

### Mock vs Real Components

The development setup uses mocks for external dependencies:

1. **JWT Mock**: Bypasses SSM and JWT verification
2. **PlantUML Mock**: Returns sample SVG/PNG without PlantUML JAR
3. **Local Layer**: Downloads real PlantUML JAR for production testing

## 🚀 Deployment

### Development Deployment

```bash
# Deploy renderer to AWS dev environment
cd services/renderer
sam deploy --config-env dev

# Deploy Forge app to development
cd apps/forge-plantuml
npx @forge/cli deploy
npx @forge/cli install --product confluence
```

### Production Deployment

```bash
# Deploy renderer to production
cd services/renderer
sam deploy --config-env prod

# Deploy Forge app to production
cd apps/forge-plantuml
npx @forge/cli deploy --environment production
npx @forge/cli install --product confluence --environment production
```

## 🐛 Troubleshooting

### Common Issues

#### "Port 3001 already in use"
```bash
# Kill existing SAM process
lsof -ti:3001 | xargs kill -9
```

#### "Module not found" errors
```bash
# Rebuild SAM with dependencies
cd services/renderer
sam build
```

#### "JWT verification failed"
- In development: Check NODE_ENV=development is set
- In production: Verify JWT secret in SSM Parameter Store

#### "PlantUML rendering failed"
- In development: Uses mock renderer (expected)
- In production: Check PlantUML layer and Graphviz binaries

### Debug Mode

```bash
# Enable verbose logging
export LOG_PAYLOADS=true
npm run local

# Check SAM logs
sam logs --name RendererFunction --tail
```

## 📊 Monitoring

### Local Development

- Health endpoint: `http://localhost:3001/health`
- SAM logs: Displayed in terminal
- Metrics: Logged to console

### Production

- CloudWatch logs: `/aws/lambda/plantuml-renderer-{env}`
- Metrics: `PlantUML/Renderer` namespace
- Alarms: Error rate, duration, cold starts

## 🤝 Contributing

### Development Workflow

1. **Setup**: Run `dev-setup.sh`
2. **Develop**: Use watch modes for hot reload
3. **Test**: Run `test-local.sh` before commits
4. **Deploy**: Test in dev environment first
5. **Production**: Deploy after thorough testing

### Code Standards

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with security rules
- **Testing**: Jest for unit/integration tests
- **Formatting**: Prettier for consistent style

### Git Hooks

- **Pre-commit**: Lint and format code
- **Pre-push**: Run tests
- **Commit-msg**: Conventional commit format

### CI/CD

- **GitHub Actions**: Automated testing and deployment
- **Staging**: Auto-deploy on main/develop push
- **Production**: Manual deployment with confirmation
- See [GitHub Actions Setup](../docs/GITHUB_ACTIONS_SETUP.md) for configuration