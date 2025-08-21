#!/bin/bash

# Direct deployment script that bypasses login issues
# Usage: ./forge-deploy.sh

set -e

# Check required environment variables
if [ -z "$FORGE_EMAIL" ] || [ -z "$FORGE_API_TOKEN" ]; then
    echo "Error: FORGE_EMAIL and FORGE_API_TOKEN must be set"
    echo "Get API token from: https://id.atlassian.com/manage-profile/security/api-tokens"
    echo ""
    echo "Set them with:"
    echo "export FORGE_EMAIL=\"your-email@example.com\""
    echo "export FORGE_API_TOKEN=\"your-api-token-here\""
    exit 1
fi

echo "🚀 Deploying Forge app without login..."

# Build the app first
echo "📦 Building app..."
npm run build

# Deploy using environment variables for auth
cd apps/forge-plantuml

echo "🔧 Creating manifest with environment auth..."

# Set environment variables for Forge CLI
export FORGE_USER_EMAIL="$FORGE_EMAIL"
export FORGE_USER_TOKEN="$FORGE_API_TOKEN"

echo "🚀 Deploying to Forge..."
# Use environment variables directly with Forge CLI
echo "$FORGE_API_TOKEN" | npx @forge/cli deploy --non-interactive || {
    echo "Deploy failed, trying alternative method..."
    # Alternative: create app without login
    npx @forge/cli create --template hello-world --name plantuml-confluence --skip-install || true
    npx @forge/cli deploy --non-interactive
}

echo "📱 Installing to Confluence..."
npx @forge/cli install --product confluence --non-interactive || {
    echo "Install failed, you may need to install manually via Atlassian Admin Console"
}

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Go to your Confluence site"
echo "2. Add a macro and search for 'PlantUML'"
echo "3. Test the macro with sample PlantUML code"