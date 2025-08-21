# Forge Authentication Setup

## Issue: Keychain Access in Docker

The Docker container can't access macOS keychain for storing credentials.

## Solution: Use API Token Authentication

### 1. Create Atlassian API Token

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a name like "Forge CLI"
4. Copy the token

### 2. Set Environment Variables

```bash
# Set your Atlassian email and API token
export FORGE_EMAIL="your-email@example.com"
export FORGE_API_TOKEN="your-api-token-here"
```

### 3. Update Docker Script

The docker-forge.sh script will pass these environment variables to the container.

### 4. Login with Environment Variables

```bash
# Set environment variables first
export FORGE_EMAIL="your-email@example.com"
export FORGE_API_TOKEN="your-api-token-here"

# Then run Docker commands
./docker-forge.sh login
```

## Alternative: Use Host Forge CLI

If Docker continues to have issues, install Forge CLI directly on macOS:

```bash
# Install Xcode command line tools (if not already installed)
xcode-select --install

# Clear npm cache
npm cache clean --force

# Try installing with specific flags
npm install -g @forge/cli --unsafe-perm --build-from-source

# Or use Homebrew Node.js instead of nvm
brew uninstall node
brew install node@20
brew link node@20 --force
npm install -g @forge/cli
```