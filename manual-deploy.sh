#!/bin/bash

# Manual deployment without interactive login
# This creates the auth file directly

set -e

# Load from .env if exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

if [ -z "$FORGE_EMAIL" ] || [ -z "$FORGE_API_TOKEN" ]; then
    echo "Error: Set FORGE_EMAIL and FORGE_API_TOKEN in .env file"
    exit 1
fi

echo "🔧 Setting up Forge authentication..."

# Create forge directory and auth file
mkdir -p ~/.forge

# Create the authentication file that Forge CLI expects
cat > ~/.forge/credentials << EOF
{
  "accounts": [
    {
      "email": "$FORGE_EMAIL",
      "token": "$FORGE_API_TOKEN",
      "accountId": "auto-detected"
    }
  ],
  "defaultAccount": "$FORGE_EMAIL"
}
EOF

echo "📦 Building project..."
npm run build

echo "🚀 Deploying Forge app..."
cd apps/forge-plantuml

# Try to deploy with the manually created credentials
npx @forge/cli deploy --verbose

echo "📱 Installing to Confluence..."
npx @forge/cli install --product confluence --verbose

echo "✅ Deployment complete!"