# PlantUML Confluence Cloud App

A production-ready Atlassian Forge app that enables PlantUML diagram editing and rendering in Confluence Cloud, with AWS Lambda-based rendering service.

## 🚀 Quick Start (10 minutes)

### Prerequisites

- Node.js 18+ and npm 8+ (Node.js 20 LTS recommended)
- AWS CLI configured with a single profile
- Forge CLI (see installation options below)
- AWS SAM CLI: [Installation guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)

#### Forge CLI Installation

**Option 1**: Use Docker (most reliable):

```bash
# Test Docker Forge CLI
./docker-forge.sh --version

# Use for all Forge commands
./docker-forge.sh login
./docker-forge.sh deploy
```

**Option 2**: Use npx (may have issues on some systems):

```bash
# Test Forge CLI
npx @forge/cli --version
```

**Option 3**: Global install (often fails with native compilation):

```bash
npm install -g @forge/cli
```

### 1. Setup AWS Infrastructure

```bash
# Clone and install dependencies
git clone <repository-url>
cd plantuml-confluence
npm install

# Create JWT secret in AWS SSM
aws ssm put-parameter \
  --profile plant-uml \
  --name "/plantuml/renderer/jwt-secret" \
  --value "$(openssl rand -base64 32)" \
  --type "SecureString" \
  --description "JWT secret for PlantUML renderer"

# Deploy renderer service
cd services/renderer
sam build
sam deploy --guided  # First time only, saves config
# sam deploy        # Subsequent deployments (automated)

# Copy the API URL from outputs
export RENDERER_URL="https://your-api-id.execute-api.region.amazonaws.com/dev"
```

### 2. Setup Forge App

```bash
# First, set up Forge authentication
# Get API token from: https://id.atlassian.com/manage-profile/security/api-tokens
export FORGE_EMAIL="your-email@example.com"
export FORGE_API_TOKEN="your-api-token-here"

# Deploy using simplified script (bypasses login issues)
./forge-deploy.sh

# Alternative: Manual deployment
# npx @forge/cli deploy --non-interactive
# npx @forge/cli install --product confluence --non-interactive
```

### 3. Test in Confluence

1. Open any Confluence page
2. Add a macro and search for "PlantUML"
3. Insert the macro and start editing diagrams!

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Confluence    │    │   Forge App      │    │  AWS Lambda     │
│     Cloud       │◄──►│  (Forge UI +     │◄──►│   Renderer      │
│                 │    │   Resolvers)     │    │ (PlantUML JAR)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │                         │
                              ▼                         ▼
                       ┌──────────────┐         ┌──────────────┐
                       │ Forge Storage│         │ API Gateway  │
                       │ (Attachments)│         │   + CORS     │
                       └──────────────┘         └──────────────┘
```

### Components

- **Forge App** (`apps/forge-plantuml/`): Forge UI-based macro with text editor
- **Renderer Service** (`services/renderer/`): Java 11 AWS Lambda with built-in PlantUML
- **Security**: JWT HS256 tokens with 60s TTL, CORS restrictions
- **Storage**: Hash-based attachment caching in Forge storage

## 🛠️ Development

### Local Development

#### Setup Development Environment

```bash
# Test local renderer
cd services/renderer
bash test-loop.sh
```

#### Option 1: Local Renderer + Forge Tunnel

```bash
# Terminal 1: Start local renderer
cd services/renderer
sam local start-api --port 3001

# Terminal 2: Start Forge tunnel
cd apps/forge-plantuml
npx @forge/cli tunnel
```

#### Option 2: Deployed Renderer + Local UI

```bash
# Use deployed staging renderer
cd apps/forge-plantuml
npx @forge/cli tunnel
```

### Testing

```bash
# Test renderer locally
cd services/renderer
bash test-loop.sh

# Manual testing
sam local start-api --port 3001
# Test with POST to http://localhost:3001/render
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build all packages |
| `npm run test` | Run all tests |
| `npm run lint` | Lint all code |
| `npm run fmt` | Format all code |

## 🔧 Configuration

### Environment Variables

#### Forge App
- `RENDERER_URL`: PlantUML renderer API endpoint
- `RENDERER_JWT_SECRET`: Shared secret for JWT signing
- `FORGE_APP_ID`: Forge application ID

#### Renderer Service
- `JWT_SECRET_PARAM`: SSM parameter path for JWT secret
- `EXPECTED_ISSUER`: Expected JWT issuer (default: plantuml-confluence)
- `LOG_PAYLOADS`: Enable payload logging (default: false)

### Admin Configuration

Access the admin page in Confluence:
1. Go to Apps → Manage Apps
2. Find "PlantUML" and click "Configure"
3. Set renderer URL and test health

## 🔒 Security

### Data Flow
1. User edits PlantUML source in Confluence
2. Forge app generates JWT with 60s TTL
3. Renderer verifies JWT and processes diagram
4. Result cached by hash, no source stored
5. Diagram rendered inline (SVG) or as attachment (PNG)

### Security Controls
- **Authentication**: JWT HS256 with short TTL
- **Authorization**: CORS restricted to Atlassian domains
- **Input Validation**: Size limits (200KB), format validation
- **Output Sanitization**: SVG script/foreignObject removal
- **Logging**: No diagram source in logs (configurable)
- **Rate Limiting**: API Gateway throttling

### Threat Model
See [SECURITY.md](./SECURITY.md) for detailed threat analysis.

## 🚀 Deployment

### CI/CD Pipeline (GitHub Actions)

Required secrets in GitHub repository settings:
```bash
# AWS
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Forge
FORGE_EMAIL=your-email@example.com
FORGE_API_TOKEN=your-api-token
FORGE_ENV_STG=staging
FORGE_ENV_PROD=production

# Renderer
RENDERER_JWT_SECRET_PARAM=/plantuml/renderer/jwt-secret
RENDERER_JWT_SECRET=your-jwt-secret
```

### Manual Deployment

```bash
# Deploy renderer (automated after first setup)
cd services/renderer
sam build
sam deploy --config-env dev    # Development
sam deploy --config-env stg    # Staging  
sam deploy --config-env prod   # Production

# Deploy Forge app
cd apps/forge-plantuml
npx @forge/cli deploy --environment production
npx @forge/cli install --product confluence --environment production
```

## 🔄 JWT Secret Rotation

```bash
# Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# Update SSM parameter
aws ssm put-parameter \
  --profile plant-uml \
  --name "/plantuml/renderer/jwt-secret" \
  --value "${NEW_SECRET}" \
  --type "SecureString" \
  --overwrite

# Update Forge app
npx @forge/cli environment set RENDERER_JWT_SECRET "${NEW_SECRET}"
npx @forge/cli deploy
```

## 🐛 Troubleshooting

### Common Issues

#### "Renderer failed: 500"
- Check CloudWatch logs: `/aws/lambda/plantuml-renderer-{env}`
- Verify JWT secret matches between Forge and Lambda
- Ensure Java 11 runtime is configured

#### "CORS error"
- Verify API Gateway CORS settings include Atlassian domains
- Check request origin matches allowed origins

#### "Permission denied"
- Verify Lambda has SSM read permissions
- Check IAM role policies in SAM template

### Debug Mode

```bash
# Enable payload logging (development only)
aws lambda update-function-configuration \
  --profile plant-uml \
  --function-name plantuml-renderer-dev \
  --environment Variables='{LOG_PAYLOADS=true}'
```

## 📊 Monitoring

### Metrics (CloudWatch)
- `PlantUML/Renderer/RenderDuration`: Render time in ms
- `PlantUML/Renderer/ColdStart`: Cold start count
- `PlantUML/Renderer/Success`: Successful renders
- `PlantUML/Renderer/Error`: Failed renders

### Logs
- Lambda: `/aws/lambda/plantuml-renderer-{env}`
- API Gateway: Automatic request/response logging

### Alerts
Set up CloudWatch alarms for:
- Error rate > 5%
- Average duration > 10s
- Cold start rate > 20%

## 📚 Documentation

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Complete development guide with local setup, testing, and workflows
- **[SECURITY.md](./SECURITY.md)** - Security architecture, threat model, and compliance details
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Development workflow, coding standards, and contribution guidelines
- **[MARKETPLACE.md](./MARKETPLACE.md)** - Atlassian Marketplace publishing guide and requirements
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and release notes
- **[GitHub Actions Setup](./docs/GITHUB_ACTIONS_SETUP.md)** - CI/CD configuration and deployment guide

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development workflow and guidelines.

## 📝 License

MIT License - see [LICENSE](./LICENSE) file.

## 🏪 Marketplace

See [MARKETPLACE.md](./MARKETPLACE.md) for Atlassian Marketplace publishing guide.