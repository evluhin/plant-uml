# PlantUML Renderer Service

AWS Lambda service with Java 11 renderer and Node.js JWT authorizer that renders PlantUML diagrams to SVG format.

## Architecture

### Components
- **Java Renderer**: PlantUML processing (256MB, ~5s cold start)
- **Node.js Authorizer**: JWT validation (128MB, ~100ms cold start)
- **API Gateway**: HTTP API with 1-hour auth caching
- **Lambda Layer**: PlantUML JAR and Graphviz binaries

### Performance
- **Cold Start**: ~5s (Java) + ~100ms (Node.js auth)
- **Warm Requests**: ~1-2s (rendering) + ~0ms (cached auth)
- **Memory Usage**: 140MB actual / 256MB allocated
- **Auth Caching**: 1 hour TTL for JWT decisions

## Local Development

### Prerequisites
- Java 11+
- Maven 3.6+
- Node.js 18+
- AWS SAM CLI
- Docker (for SAM local)

### Quick Start

```bash
# Automated test (builds, starts SAM local, tests endpoint)
bash test-loop.sh

# Manual testing
sam build
sam local start-api --port 3001

# Test endpoints (JWT auth bypassed in development)
curl http://localhost:3001/health
curl -X POST http://localhost:3001/render \
  -H "Content-Type: application/json" \
  -d '{"source":"@startuml\nAlice -> Bob: Hello\n@enduml","format":"svg"}'
```

### Build & Deploy

```bash
# Build both Java and Node.js components
sam build

# Deploy to development
sam deploy --config-env dev

# Deploy to production  
sam deploy --config-env prod
```

## API Endpoints

### POST /render (Authenticated)

**Authentication**: JWT Bearer token (API Gateway Lambda Authorizer)

**Request:**
```json
{
  "source": "@startuml\nAlice -> Bob: Hello\n@enduml",
  "format": "svg"
}
```

**Response:**
```xml
<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
  <!-- PlantUML generated SVG -->
</svg>
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `400 Bad Request`: Invalid request body or missing source
- `500 Internal Server Error`: PlantUML rendering failed

### GET /health (Public)

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-09T15:00:00.000Z"
}
```

## Configuration

### Environment Variables

#### Java Renderer Lambda
- `NODE_ENV`: Set to "development" to skip JWT validation in authorizer
- `GRAPHVIZ_DOT`: Path to Graphviz binary (`/opt/bin/dot`)
- `PLANTUML_JAR`: Path to PlantUML JAR (`/opt/plantuml.jar`)

#### Node.js Authorizer Lambda
- `NODE_ENV`: Set to "development" to skip JWT validation
- `JWT_SECRET_PARAM`: SSM parameter path for JWT secret

### Deployment Environments

| Environment | Stack Name | JWT Secret Parameter |
|-------------|------------|---------------------|
| Development | `plantuml-renderer-dev` | `/plantuml/renderer/jwt-secret-dev` |
| Production | `plantuml-renderer-prod` | `/plantuml/renderer/jwt-secret-prod` |

## Security

### JWT Authentication
- **Algorithm**: HS256
- **TTL**: 60 seconds
- **Issuer**: `plantuml-confluence`
- **Caching**: 1 hour at API Gateway level
- **Development Mode**: Authentication bypassed when `NODE_ENV=development`

### CORS Configuration
- **Allowed Origins**: `*` (configure for production use)
- **Allowed Headers**: `Content-Type`, `Authorization`
- **Allowed Methods**: `GET`, `POST`, `OPTIONS`
- **Max Age**: 600 seconds

### SnapStart Optimization
- **Feature**: Enabled for Java renderer Lambda
- **Benefit**: Reduces cold start from ~8s to ~5s
- **Requirement**: Function alias (`live`) must be used
- **Status Check**: `aws lambda get-function --function-name plantuml-renderer-prod`

## Troubleshooting

### Common Issues

**"Export already exists" during deployment:**
```bash
# Check for conflicting stacks
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE
# Delete old stack if needed
aws cloudformation delete-stack --stack-name plantuml-renderer
```

**JWT authentication failing:**
- Verify JWT secret exists in SSM Parameter Store
- Check authorizer Lambda logs in CloudWatch
- Ensure `NODE_ENV=development` for local testing

**SnapStart not working (cold starts >8s):**
```bash
# Check SnapStart status
aws lambda get-function --function-name plantuml-renderer-prod \
  --query 'Configuration.SnapStart'

# Verify alias exists
aws lambda get-alias --function-name plantuml-renderer-prod --name live
```

**PlantUML rendering errors:**
- Check CloudWatch logs for Java exceptions
- Verify PlantUML layer is properly attached
- Test with simple diagram first

### Debug Commands

```bash
# Real-time logs
sam logs --name plantuml-renderer-dev --tail

# Test local deployment
sam local start-api --port 3001

# Validate SAM template
sam validate

# Check stack status
aws cloudformation describe-stacks --stack-name plantuml-renderer-dev
```

## Performance Optimization

### Current Optimizations
- **Memory**: Right-sized to 256MB (Java) and 128MB (Node.js)
- **SnapStart**: Enabled for Java Lambda
- **Auth Caching**: 1-hour TTL at API Gateway
- **Layer**: PlantUML JAR loaded once per container

### Future Optimizations
- **Provisioned Concurrency**: For guaranteed warm starts
- **Container Images**: Better cold start optimization
- **Memory Tuning**: Increase if cold starts become critical
- **Warmup Schedule**: EventBridge rule for business hours

---

**For complete setup instructions, see [../DEVELOPMENT.md](../DEVELOPMENT.md)**