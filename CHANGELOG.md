# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with monorepo structure
- Forge app with Svelte-based Custom UI
- AWS Lambda renderer service with PlantUML JAR
- Monaco editor with PlantUML syntax highlighting
- Live preview with debounced rendering
- Support for SVG and PNG output formats
- Multiple theme support (default, plain, monochrome, bluegray)
- Hash-based diagram caching for performance
- JWT-based authentication between Forge and renderer
- Admin page for renderer configuration
- Comprehensive test suite (unit, integration, E2E)
- GitLab CI/CD pipeline with staging and production environments
- Security controls with input validation and output sanitization
- Documentation (README, SECURITY, MARKETPLACE, CONTRIBUTING)

### Security
- JWT HS256 authentication with 60-second TTL
- CORS restrictions to Atlassian domains
- Input size limits (200KB maximum)
- SVG sanitization to prevent XSS
- No diagram source logging policy
- Encrypted SSM parameter storage for secrets

## [1.0.0] - 2024-01-15

### Added
- Initial release of PlantUML for Confluence Cloud
- Core macro functionality for embedding PlantUML diagrams
- Basic editor with syntax highlighting
- SVG and PNG rendering support
- Theme selection capabilities
- Responsive design for all screen sizes
- Keyboard shortcuts (Ctrl/Cmd+Enter to render)
- Error handling and user feedback
- Performance optimization with caching
- Security implementation with JWT authentication
- AWS Lambda-based rendering service
- Comprehensive documentation and setup guides

### Technical Details
- **Frontend**: Svelte 4 + Vite + Monaco Editor
- **Backend**: AWS Lambda (Node.js 20) + API Gateway
- **Infrastructure**: AWS SAM with CloudFormation
- **Security**: JWT HS256, CORS, input validation
- **Testing**: Jest (unit), Playwright (E2E), Supertest (integration)
- **CI/CD**: GitLab CI with automated testing and deployment
- **Monitoring**: CloudWatch metrics and logging

### Supported Features
- PlantUML diagram types: sequence, class, activity, use case, etc.
- Output formats: SVG (inline), PNG (attachment)
- Themes: default, plain, monochrome, bluegray
- Customizable dimensions with aspect ratio preservation
- Live preview with 800ms debounce
- Hash-based caching for performance
- Accessibility features with ARIA labels and keyboard navigation

---

## Release Notes Template

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features and capabilities

### Changed
- Changes to existing functionality

### Deprecated
- Features that will be removed in future versions

### Removed
- Features removed in this version

### Fixed
- Bug fixes and corrections

### Security
- Security improvements and fixes
```

## Version History

| Version | Release Date | Key Features |
|---------|--------------|--------------|
| 1.0.0   | 2024-01-15   | Initial release with core functionality |

## Migration Guide

### From 0.x to 1.0.0
This is the initial release, no migration required.

### Future Migrations
Migration guides will be provided for breaking changes in future versions.

## Support

For questions about releases or upgrade issues:
- Check the [README](./README.md) for setup instructions
- Review [CONTRIBUTING](./CONTRIBUTING.md) for development guidelines
- Open an issue on GitHub for bug reports
- Contact support for enterprise assistance