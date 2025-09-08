# PlantUML Confluence Cloud App

A production-ready Atlassian Forge app that enables PlantUML diagram editing and rendering in Confluence Cloud, with Java 11 AWS Lambda rendering service and SnapStart optimization.

## 🚀 Quick Start

**New to the project?** See [QUICKSTART.md](./QUICKSTART.md) for 5-minute setup.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Confluence    │    │   Forge App      │    │  AWS Lambda     │
│     Cloud       │◄──►│  (Forge UI +     │◄──►│   Renderer      │
│                 │    │   Resolvers)     │    │ (PlantUML JAR)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │                         │
                              ▼                         ▼
                       ┌──────────────┐         ┌──────────────┐
                       │ Forge Storage│         │ API Gateway  │
                       │ (1GB/client) │         │   + CORS     │
                       └──────────────┘         └──────────────┘
```

### Components
- **Forge App**: React UI macro with cache reset option
- **Renderer Service**: Java 11 AWS Lambda with SnapStart (~1-2s cold start)
- **Security**: JWT HS256 tokens, CORS restrictions
- **Storage**: Hash-based SVG caching (1GB per client)

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [QUICKSTART.md](./QUICKSTART.md) | 5-minute setup guide |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Development, testing, CI/CD |
| [SECURITY.md](./SECURITY.md) | Security architecture & threat model |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Development workflow & standards |
| [MARKETPLACE.md](./MARKETPLACE.md) | Atlassian Marketplace publishing |

## 🔧 Key Features

- **Cache Reset**: Users can reset broken diagrams via macro config
- **SnapStart**: Fast cold starts with AWS Lambda optimization
- **SVG Output**: Clean, scalable diagram rendering
- **JWT Security**: Short-lived tokens with 60s TTL
- **Auto-scaling**: 1GB storage per Confluence instance

## 📝 License

MIT License - see [LICENSE](./LICENSE) file.