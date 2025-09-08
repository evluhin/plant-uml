# Quick Start Guide

## Prerequisites
- Java 11+, Node.js 18+, AWS CLI, AWS SAM CLI
- Get Forge API token: https://id.atlassian.com/manage-profile/security/api-tokens

## 5-Minute Setup

```bash
# 1. Clone and install
git clone <repository-url>
cd plantuml-confluence
npm install

# 2. Create JWT secret
aws ssm put-parameter \
  --name "/plantuml/renderer/jwt-secret" \
  --value "$(openssl rand -base64 32)" \
  --type "SecureString"

# 3. Deploy renderer
cd services/renderer
sam build && sam deploy --guided

# 4. Deploy Forge app
cd ../apps/forge-plantuml
export FORGE_EMAIL="your-email@example.com"
export FORGE_API_TOKEN="your-api-token"
npx @forge/cli deploy
npx @forge/cli install --product confluence
```

## Test
1. Open Confluence page
2. Add macro → "PlantUML"
3. Edit diagram source
4. Use "Reset cache" if diagram appears broken

## Next Steps
- **Development**: See [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Security**: See [SECURITY.md](./SECURITY.md)
- **Issues**: Check troubleshooting in [DEVELOPMENT.md](./DEVELOPMENT.md)