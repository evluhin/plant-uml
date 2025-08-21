#!/bin/bash

# Docker wrapper for Forge CLI commands
# Usage: ./docker-forge.sh login
#        ./docker-forge.sh deploy
#        ./docker-forge.sh install --product confluence

set -e

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Check if required variables are set
if [ -z "$FORGE_EMAIL" ] || [ -z "$FORGE_API_TOKEN" ]; then
    echo "Error: FORGE_EMAIL and FORGE_API_TOKEN must be set"
    echo "Either set them as environment variables or add them to .env file"
    exit 1
fi

# Build Docker image if it doesn't exist
if ! docker image inspect forge-dev >/dev/null 2>&1; then
    echo "Building Forge development Docker image..."
    docker build -f Dockerfile.forge -t forge-dev .
fi

# Run Forge CLI command in container
docker run -it --rm \
    -v "$(pwd)":/app \
    -v "$HOME/.forge":/root/.forge \
    -e FORGE_EMAIL="$FORGE_EMAIL" \
    -e FORGE_API_TOKEN="$FORGE_API_TOKEN" \
    -w /app/apps/forge-plantuml \
    forge-dev \
    forge "$@"