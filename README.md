# PlantUML Confluence Cloud App

A production-ready Atlassian Forge app that enables PlantUML diagram editing and rendering in Confluence Cloud, with optimized AWS Lambda backend and automated CI/CD pipeline.

## 🚀 Quick Start

**New to the project?** Use our automated setup:

```bash
git clone <repository-url>
cd plant-uml-confluence
./scripts/setup.sh
```

**Manual setup?** See [SETUP.md](./SETUP.md) for detailed instructions.

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
                       │ (Diagram     │         │ + JWT Auth   │
                       │  Cache)      │         │ (1hr cache)  │
                       └──────────────┘         └──────────────┘
```

### Key Components

- **Forge App**: React UI with cache management and configuration
- **AWS Lambda**: Java renderer (256MB, ~5s cold start with SnapStart)
- **Node.js Authorizer**: JWT validation with 1-hour API Gateway caching
- **Security**: JWT HS256 tokens (60s TTL), environment-specific secrets
- **Storage**: Hash-based SVG/PNG caching in Forge storage

## 📊 Performance & Cost

| Metric            | Development                    | Production                 |
| ----------------- | ------------------------------ | -------------------------- |
| **Cold Start**    | ~5s (Java) + ~100ms (Auth)     | ~5s (Java) + ~0ms (cached) |
| **Warm Requests** | ~1-2s rendering                | ~1-2s rendering            |
| **Auth Overhead** | ~100ms                         | ~0ms (1hr cache)           |
| **Expected Cost** | ~$2-5/month                    | ~$5-15/month               |
| **Memory Usage**  | 140MB actual / 256MB allocated | Optimized for cost         |

## 🔧 Development Environments

| Environment     | Purpose         | Auto-Deploy          | Stack Name               |
| --------------- | --------------- | -------------------- | ------------------------ |
| **Development** | Feature testing | ✅ On `develop` push | `plantuml-renderer-dev`  |
| **Production**  | Live users      | 🔒 Manual trigger    | `plantuml-renderer-prod` |

## 🛠️ Technology Stack

- **Frontend**: React with Forge UI Kit
- **Backend**: Atlassian Forge resolvers (Node.js)
- **Renderer**: Java 21 AWS Lambda with PlantUML + Graphviz
- **Authentication**: Node.js 20 Lambda Authorizer with JWT
- **Infrastructure**: AWS SAM, API Gateway, CloudFormation
- **CI/CD**: GitHub Actions with cost-optimized workflows
- **Security**: JWT HS256, AWS SSM Parameter Store, CORS

## 📚 Documentation

| Document                             | Purpose                                    |
| ------------------------------------ | ------------------------------------------ |
| [SETUP.md](./SETUP.md)               | Complete setup guide (local, dev, prod)    |
| [DEVELOPMENT.md](./DEVELOPMENT.md)   | Development workflow and troubleshooting   |
| [SECURITY.md](./SECURITY.md)         | Security architecture & threat model       |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Development standards & contribution guide |

## 🚀 Quick Commands

```bash
# Setup everything (automated)
./scripts/setup.sh

# Local development
./scripts/dev.sh

# Deploy to development
./scripts/deploy-dev.sh

# Deploy to production (manual)
./scripts/deploy-prod.sh

# Run tests
npm test

# Health check
./scripts/health-check.sh
```

## 🔐 Security Features

- **JWT Authentication**: HS256 with 60s TTL
- **Environment Isolation**: Separate secrets for dev/prod
- **Input Validation**: Size limits, format validation
- **Output Sanitization**: SVG script removal
- **Rate Limiting**: API Gateway throttling
- **Audit Logging**: CloudWatch monitoring (no source code logged)

## 🧪 Testing

- **Unit Tests**: Jest for Forge app logic
- **Integration Tests**: SAM local API testing
- **Smoke Tests**: Health endpoint validation
- **Security Tests**: JWT validation, input sanitization
- **Performance Tests**: Cold start and rendering benchmarks

## 🤝 Contributing

1. **Fork** the repository
2. **Create** feature branch from `develop`
3. **Make** changes and test locally
4. **Submit** PR to `develop` (auto-deploys to dev environment)
5. **Test** in development environment
6. **Create** PR to `master` for production (manual approval)

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## 📝 License

MIT License - see [LICENSE](./LICENSE) file.

---

**Need help?** Check [DEVELOPMENT.md](./DEVELOPMENT.md) for troubleshooting or create an issue.
