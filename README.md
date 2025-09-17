# PlantUML Confluence Cloud App

A production-ready Atlassian Forge app that enables PlantUML diagram editing and rendering in Confluence Cloud, with Java 11 AWS Lambda rendering service, Node.js Lambda Authorizer, and SnapStart optimization.

## 🚀 Quick Start

**New to the project?** See [QUICKSTART.md](./QUICKSTART.md) for 5-minute setup.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Confluence    │    │   Forge App      │    │  AWS Lambda     │
│     Cloud       │◄──►│  (React UI +     │◄──►│   Renderer      │
│                 │    │   Resolvers)     │    │ (PlantUML JAR)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │                         │
                              ▼                         ▼
                       ┌──────────────┐         ┌──────────────┐
                       │ Forge Storage│         │ API Gateway  │
                       │ (1GB/client) │         │ + Authorizer │
                       └──────────────┘         └──────────────┘
                                                         │
                                                         ▼
                                                ┌──────────────┐
                                                │   Node.js    │
                                                │ JWT Auth     │
                                                │ (~100ms)     │
                                                └──────────────┘
```

### Components
- **Forge App**: React UI macro with cache reset and configuration options
- **Java Renderer**: AWS Lambda with SnapStart (~5s cold start, 256MB memory)
- **Node.js Authorizer**: JWT validation with 1-hour caching (~100ms cold start)
- **Security**: JWT HS256 tokens (60s TTL), API Gateway auth caching
- **Storage**: Hash-based SVG caching in Forge storage (1GB per client)

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [QUICKSTART.md](./QUICKSTART.md) | 5-minute setup guide for new users |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Complete development guide, testing, troubleshooting |
| [SECURITY.md](./SECURITY.md) | Security architecture & threat model |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Development workflow & coding standards |
| [MARKETPLACE.md](./MARKETPLACE.md) | Atlassian Marketplace publishing guide |
| [services/renderer/README.md](./services/renderer/README.md) | Lambda renderer service documentation |
| [docs/GITHUB_SETUP.md](./docs/GITHUB_SETUP.md) | GitHub Actions CI/CD setup |

## 🔧 Key Features

- **Cache Reset**: Users can reset broken diagrams via macro configuration
- **SnapStart**: Java Lambda cold start optimization (8s → 5s)
- **Fast Auth**: Node.js authorizer with API Gateway caching (1 hour TTL)
- **SVG Output**: Clean, scalable diagram rendering with PlantUML
- **JWT Security**: Short-lived tokens with environment-specific secrets
- **Auto-scaling**: Serverless architecture with 1GB storage per Confluence instance
- **CI/CD**: GitHub Actions with automated dev deployment and manual prod deployment

## 🛠️ Technology Stack

- **Frontend**: React with Forge UI Kit components
- **Backend**: Atlassian Forge resolvers (Node.js)
- **Renderer**: Java 11 AWS Lambda with PlantUML library
- **Authentication**: Node.js Lambda Authorizer with JWT validation
- **Infrastructure**: AWS SAM, API Gateway, CloudFormation
- **CI/CD**: GitHub Actions, automated testing and deployment
- **Security**: JWT HS256, AWS SSM Parameter Store, CORS

## 🚀 Deployment Environments

| Environment | Purpose | Auto-Deploy | Stack Name |
|-------------|---------|-------------|------------|
| **Development** | Feature testing | ✅ On `develop` branch | `plantuml-renderer-dev` |
| **Production** | Live users | 🔒 Manual approval | `plantuml-renderer-prod` |

## 📊 Performance

- **Cold Start**: ~5s (Java renderer) + ~100ms (Node.js auth)
- **Warm Requests**: ~1-2s (rendering) + ~0ms (cached auth)
- **Memory Usage**: 140MB actual / 256MB allocated (cost-optimized)
- **Caching**: 1-hour auth cache, hash-based diagram cache
- **Scalability**: Serverless auto-scaling, 1GB storage per client

## 🔐 Security Features

- **JWT Authentication**: HS256 tokens with 60-second TTL
- **Environment Isolation**: Separate secrets for dev/prod environments
- **API Gateway**: CORS restrictions and rate limiting
- **Secret Management**: AWS SSM Parameter Store with encryption
- **Development Mode**: JWT bypass for local testing

## 💰 Cost Optimization

- **Memory**: Right-sized to 256MB (vs 1024MB default)
- **Auth Caching**: 1-hour TTL reduces Lambda invocations by 99%
- **SnapStart**: Reduces cold start time and cost
- **Pay-per-use**: No fixed costs, scales to zero
- **Expected Cost**: ~$2-10/month with CI/CD

## 🧪 Testing

- **Unit Tests**: Java JUnit tests for renderer logic
- **Integration Tests**: End-to-end API testing with SAM local
- **Smoke Tests**: Health endpoint validation in CI/CD
- **Local Development**: Docker-free testing with SAM CLI

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Development workflow and branch strategy
- Code standards and linting rules
- Testing requirements
- Pull request process

## 📝 License

MIT License - see [LICENSE](./LICENSE) file.

---

**Need help?** Check [DEVELOPMENT.md](./DEVELOPMENT.md) for troubleshooting or create an issue.