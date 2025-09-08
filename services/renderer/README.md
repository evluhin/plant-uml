# PlantUML Renderer Service

Java 11 AWS Lambda function with SnapStart that renders PlantUML diagrams to SVG format with ~1-2s cold start.

## Architecture

- **Runtime**: Java 11
- **Dependencies**: PlantUML library via Maven
- **Input**: JSON with PlantUML source code
- **Output**: SVG diagram

## Local Development

### Prerequisites
- Java 11+
- Maven 3.6+
- AWS SAM CLI
- Docker (for SAM local)

### Testing

```bash
# Automated test (builds, starts SAM local, tests endpoint)
bash test-loop.sh

# Manual testing
sam build
sam local start-api --port 3001

# Test endpoint
curl -X POST http://localhost:3001/render \
  -H "Content-Type: application/json" \
  -d '{"source":"@startuml\nAlice -> Bob: Hello\n@enduml","format":"svg"}'
```

### Build & Deploy

```bash
# Build
sam build

# Deploy to development
sam deploy --config-env dev

# Deploy to production  
sam deploy --config-env prod
```

## API

### POST /render

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

### GET /health

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-02T15:00:00.000Z"
}
```

## Configuration

Environment variables:
- `NODE_ENV`: Set to "development" to skip JWT validation
- `JWT_SECRET_PARAM`: SSM parameter path for JWT secret
- `GRAPHVIZ_DOT`: Path to Graphviz dot binary (from layer)
- `PLANTUML_JAR`: Path to PlantUML JAR (from layer)

## Security

- JWT HS256 token validation (skipped in development)
- CORS enabled for Atlassian domains
- SnapStart optimization for faster cold starts
- PlantUML library integrated via Maven dependency