#!/bin/bash

# Development setup script for PlantUML renderer
set -e

echo "🔧 Setting up PlantUML renderer for local development..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo "🏗️ Building TypeScript..."
npm run build

# Build SAM layer
echo "🎯 Building SAM layer..."
sam build

# Set up local environment
echo "🌍 Setting up local environment..."
export AWS_DEFAULT_REGION=us-east-1
export NODE_ENV=development

# Create local test JWT secret
mkdir -p ~/.aws
cat > ~/.aws/credentials << EOF
[default]
aws_access_key_id = dummy
aws_secret_access_key = dummy
region = us-east-1
EOF

cat > ~/.aws/config << EOF
[default]
region = us-east-1
output = json
EOF

echo "✅ Development setup complete!"
echo ""
echo "To start local development:"
echo "  npm run dev     # Start TypeScript watch mode"
echo "  npm run local   # Start SAM local API"
echo "  npm run test    # Run tests"