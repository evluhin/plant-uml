# Security Documentation

## Overview

This document outlines the security architecture, threat model, and controls for the PlantUML Confluence Cloud app.

## Data Flow & Processing

### 1. Data Flow Diagram

```
┌─────────────┐   JWT (60s TTL)   ┌─────────────┐   PlantUML Source   ┌─────────────┐
│ Confluence  │ ────────────────► │ Forge App   │ ──────────────────► │ AWS Lambda  │
│ Cloud       │                   │             │                     │ Renderer    │
└─────────────┘                   └─────────────┘                     └─────────────┘
       ▲                                 │                                     │
       │                                 ▼                                     ▼
       │                          ┌─────────────┐                      ┌─────────────┐
       │                          │ Forge       │                      │ CloudWatch  │
       └──────────────────────────│ Storage     │                      │ Logs        │
              SVG/PNG              │ (Cache)     │                      │ (No Source) │
                                   └─────────────┘                      └─────────────┘
```

### 2. Data Processing

| Component | Data Processed | Retention | Purpose |
|-----------|----------------|-----------|---------|
| Forge App | PlantUML source, parameters | Session only | Macro rendering |
| Forge Storage | Rendered SVG/PNG (by hash) | Until cache eviction | Performance optimization |
| AWS Lambda | PlantUML source (in memory) | 0 seconds | Diagram rendering |
| CloudWatch | Metrics, errors (no source) | 14 days | Monitoring |

### 3. Data Retention Policy

- **PlantUML Source**: Never persisted, processed in memory only
- **Rendered Diagrams**: Cached by content hash until eviction
- **Logs**: Metrics and errors only, 14-day retention
- **JWT Tokens**: 60-second TTL, not stored

## Threat Model (STRIDE Analysis)

### Spoofing
**Threat**: Unauthorized access to renderer API
- **Control**: JWT authentication with short TTL (60s)
- **Control**: Issuer validation in JWT payload
- **Control**: CORS restrictions to Atlassian domains only

### Tampering
**Threat**: Malicious PlantUML source injection
- **Control**: Input size limits (200KB max)
- **Control**: SVG output sanitization (script/foreignObject removal)
- **Control**: Sandboxed Lambda execution environment

### Repudiation
**Threat**: Denial of rendering requests
- **Control**: CloudWatch request logging with correlation IDs
- **Control**: JWT nonce for request uniqueness

### Information Disclosure
**Threat**: PlantUML source exposure in logs
- **Control**: `LOG_PAYLOADS=false` by default
- **Control**: No source content in CloudWatch logs
- **Control**: Encrypted SSM parameters for secrets

### Denial of Service
**Threat**: Resource exhaustion attacks
- **Control**: API Gateway rate limiting (50 req/s, 100 burst)
- **Control**: Lambda timeout (20s) and memory limits (1024MB)
- **Control**: Input size validation (200KB max)
- **Control**: Lambda concurrency limits

### Elevation of Privilege
**Threat**: Lambda execution escape
- **Control**: Minimal IAM permissions (SSM read only)
- **Control**: No VPC access, isolated execution
- **Control**: Read-only Lambda layer with binaries

## Security Controls

### 1. Authentication & Authorization

#### JWT Token Security
```typescript
// Token structure
{
  "iss": "plantuml-confluence",  // Verified issuer
  "iat": 1640995200,             // Issued at
  "exp": 1640995260,             // 60s expiry
  "nonce": "random-string"       // Replay protection
}
```

- **Algorithm**: HS256 (HMAC with SHA-256)
- **Secret**: 256-bit random key in AWS SSM Parameter Store
- **TTL**: 60 seconds maximum
- **Validation**: Issuer, expiry, and signature verification

#### CORS Configuration
```yaml
AllowOrigins:
  - "https://*.atlassian.net"
  - "https://developer.atlassian.com"
AllowMethods: [POST, OPTIONS]
AllowHeaders: [Content-Type, Authorization]
MaxAge: 600
```

### 2. Input Validation

#### Request Validation
- **Source Size**: Maximum 200KB
- **Format**: Only 'svg' or 'png' allowed
- **Theme**: Optional string, validated against known themes
- **Content-Type**: Must be 'application/json'

#### PlantUML Processing
- **Timeout**: 15-second maximum render time
- **Memory**: 1024MB Lambda memory limit
- **Sandboxing**: Isolated Lambda execution environment

### 3. Output Sanitization

#### SVG Sanitization
```typescript
function sanitizeSVG(svg: string): string {
  return svg
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<foreignObject[^>]*>.*?<\/foreignObject>/gis, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}
```

### 4. Logging & Monitoring

#### Security Logging
- **Authentication failures**: JWT verification errors
- **Rate limiting**: Throttled requests
- **Input validation**: Oversized or malformed requests
- **Rendering errors**: Failed diagram generation

#### What's NOT Logged
- PlantUML source content
- JWT token values
- User-specific identifiers
- Diagram content or metadata

### 5. Infrastructure Security

#### AWS Lambda
- **Runtime**: Node.js 20 (latest security patches)
- **Permissions**: Minimal IAM (SSM read only)
- **Network**: No VPC, internet access only for updates
- **Encryption**: All data encrypted at rest and in transit

#### API Gateway
- **TLS**: 1.2+ enforced
- **Rate Limiting**: 50 requests/second, 100 burst
- **Logging**: Request/response metadata only
- **CORS**: Strict origin validation

#### SSM Parameter Store
- **Encryption**: KMS-encrypted SecureString parameters
- **Access**: Lambda execution role only
- **Rotation**: Manual rotation supported

## Compliance Considerations

### Data Privacy
- **GDPR**: No personal data processed or stored
- **Data Residency**: AWS region configurable
- **Right to Erasure**: No persistent user data
- **Data Minimization**: Only necessary data processed

### Security Standards
- **OWASP Top 10**: Addressed through input validation, authentication, logging
- **SOC 2**: AWS Lambda and API Gateway compliance
- **ISO 27001**: AWS infrastructure compliance

## Incident Response

### Security Event Types
1. **Authentication bypass**: Invalid JWT accepted
2. **Input validation bypass**: Oversized or malicious input processed
3. **Output sanitization failure**: Malicious content in rendered output
4. **Rate limiting bypass**: Excessive requests not throttled

### Response Procedures
1. **Immediate**: Disable affected Lambda function
2. **Investigation**: Review CloudWatch logs and metrics
3. **Mitigation**: Deploy security patches
4. **Recovery**: Restore service with fixes
5. **Post-incident**: Update security controls

### Contact Information
- **Security Team**: security@company.com
- **On-call**: +1-555-SECURITY
- **Escalation**: CTO, CISO

## Security Testing

### Automated Testing
- **SAST**: ESLint security rules, TypeScript strict mode
- **Dependency Scanning**: npm audit, Snyk integration
- **Infrastructure**: SAM template security validation

### Manual Testing
- **Penetration Testing**: Annual third-party assessment
- **Code Review**: Security-focused peer review
- **Threat Modeling**: Quarterly STRIDE analysis updates

## Security Configuration

### Environment Variables
```bash
# Production security settings
LOG_PAYLOADS=false                    # Never log diagram source
JWT_SECRET_PARAM=/plantuml/jwt-secret # Encrypted SSM parameter
EXPECTED_ISSUER=plantuml-confluence   # JWT issuer validation
NODE_ENV=production                   # Production security defaults
```

### Monitoring Alerts
- Error rate > 5% (potential attack)
- Average response time > 10s (DoS indicator)
- Cold start rate > 20% (resource exhaustion)
- Authentication failure rate > 1% (brute force)

## Security Updates

### Dependency Management
- **Automated**: Dependabot security updates
- **Manual**: Monthly security patch review
- **Critical**: Emergency patching within 24 hours

### Security Advisories
- **Node.js**: Monitor Node.js security releases
- **PlantUML**: Monitor PlantUML security advisories
- **AWS**: Subscribe to AWS security bulletins

---

**Last Updated**: 2024-01-15  
**Next Review**: 2024-04-15  
**Document Owner**: Security Team