#!/bin/bash
set -e

echo "🚀 Deploying PlantUML Confluence App"

# Deploy Lambda renderer
echo "📦 Building and deploying renderer..."
cd services/renderer
sam build
sam deploy --profile plant-uml
cd ../..

# Deploy Forge app
echo "🔨 Deploying Forge app..."
cd apps/forge-plantuml
npx @forge/cli deploy
cd ../..

echo "✅ Deployment complete!"
echo "💡 Don't forget to install the app in Confluence if this is the first deployment"