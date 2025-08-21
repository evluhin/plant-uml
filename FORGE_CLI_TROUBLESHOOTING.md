# Forge CLI Installation Troubleshooting

## Issue: Native Compilation Failure on macOS

The error you're seeing is due to the `keytar` native dependency failing to compile on Node.js 23 with macOS.

## Solutions (try in order)

### 1. Use Node.js 20 LTS (Recommended)

```bash
# Install Node Version Manager if not already installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Install and use Node.js 20 LTS
nvm install 20
nvm use 20
nvm alias default 20

# Now install Forge CLI
npm install -g @forge/cli
```

### 2. Use npx (No Global Install)

If global installation continues to fail, use npx:

```bash
# Test Forge CLI without installing
npx @forge/cli --version

# Use npx for all Forge commands
npx @forge/cli login
npx @forge/cli deploy
npx @forge/cli install --product confluence
```

### 3. Alternative: Use Docker

Create a `Dockerfile` for Forge development:

```dockerfile
FROM node:20-alpine
RUN npm install -g @forge/cli
WORKDIR /app
CMD ["sh"]
```

```bash
# Build and run
docker build -t forge-dev .
docker run -it -v $(pwd):/app forge-dev

# Inside container
forge login
forge deploy
```

### 4. Fix Native Dependencies (Advanced)

If you must use Node.js 23:

```bash
# Install Xcode command line tools
xcode-select --install

# Set Python path for node-gyp
export PYTHON=/opt/homebrew/bin/python3

# Try installing with specific flags
npm install -g @forge/cli --build-from-source
```

## Verification

Test your Forge CLI installation:

```bash
# If globally installed
forge --version

# If using npx
npx @forge/cli --version
```

## Project Setup with npx

If using npx, update your workflow:

```bash
# Clone and setup project
git clone <repository-url>
cd plantuml-confluence
npm install

# Deploy renderer service first
cd services/renderer
sam build
sam deploy --guided

# Deploy Forge app with npx
cd ../apps/forge-plantuml
npx @forge/cli login
npx @forge/cli environment set RENDERER_URL "your-api-url"
npx @forge/cli deploy
npx @forge/cli install --product confluence
```

The npx approach is often more reliable and doesn't require dealing with global package compilation issues.