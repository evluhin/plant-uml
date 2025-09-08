# Quick Start Guide

## Prerequisites
- Java 11+
- Node.js 18+ and npm 8+
- AWS CLI configured
- AWS SAM CLI installed

## 5-Minute Setup

### 1. Clone and Install
```bash
git clone <repository-url>
cd plantuml-confluence
npm install
```

### 2. Create JWT Secret
```bash
aws ssm put-parameter \
  --name "/plantuml/renderer/jwt-secret" \
  --value "$(openssl rand -base64 32)" \
  --type "SecureString"
```

### 3. Deploy Everything
```bash
./deploy.sh
```

### 4. Configure Forge App
```bash
cd apps/forge-plantuml
npx @forge/cli environment set RENDERER_URL "https://your-api-id.execute-api.region.amazonaws.com/dev"
npx @forge/cli install --product confluence
```

### 5. Test in Confluence
1. Go to any Confluence page
2. Add macro → Search "PlantUML"
3. Insert macro and edit diagram

## Features
- ✅ SVG diagram rendering
- ✅ Cache reset option in macro config
- ✅ ~1-2s cold start with SnapStart
- ✅ 1GB storage per client
- ✅ JWT authentication

## Troubleshooting
- **Cold start slow?** SnapStart is enabled automatically
- **Diagram broken?** Use "Reset cache" checkbox in macro config
- **JWT errors?** Check SSM parameter exists

## Next Steps
- See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development guide
- See [README.md](./README.md) for complete documentation