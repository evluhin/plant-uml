# Contributing Guide

Thank you for your interest in contributing to the PlantUML Confluence Cloud app! This guide will help you get started with development and understand our contribution process.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and pnpm 8+
- AWS CLI configured
- Forge CLI: `npm install -g @forge/cli`
- Git with SSH keys configured

### Setup Development Environment

```bash
# Clone repository
git clone git@github.com:yourorg/plantuml-confluence.git
cd plantuml-confluence

# Install dependencies
pnpm install

# Setup git hooks
pnpm prepare

# Run tests to verify setup
pnpm test
```

## 🏗️ Development Workflow

### Branch Strategy

We use **Git Flow** with the following branches:

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New features and enhancements
- `hotfix/*`: Critical bug fixes
- `release/*`: Release preparation

### Creating a Feature Branch

```bash
# Start from develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... development work ...

# Commit changes
git add .
git commit -m "feat: add new feature description"

# Push branch
git push origin feature/your-feature-name
```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `perf`: Performance improvements

#### Examples

```bash
feat(editor): add syntax highlighting for PlantUML
fix(renderer): handle timeout errors gracefully
docs: update installation instructions
test(jwt): add unit tests for token verification
```

## 🧪 Testing

### Running Tests

```bash
# All tests
pnpm test

# Unit tests only
pnpm -r test

# E2E tests
cd apps/forge-plantuml
pnpm test:ui

# Integration tests (requires local renderer)
cd services/renderer
sam local start-api --port 3001 &
pnpm test:integration
```

### Test Coverage

- Maintain >80% code coverage
- All new features must include tests
- Bug fixes must include regression tests

### Test Structure

```
src/
├── __tests__/           # Unit tests
│   ├── utils.test.ts
│   └── components.test.ts
└── components/
    └── Editor.svelte

tests/
├── e2e/                 # End-to-end tests
│   └── editor.spec.ts
└── integration/         # Integration tests
    └── api.test.ts
```

## 🎨 Code Style

### TypeScript Guidelines

- Use strict TypeScript configuration
- Prefer explicit types over `any`
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

```typescript
/**
 * Generates a hash for PlantUML diagram caching
 * @param source - PlantUML source code
 * @param format - Output format (svg or png)
 * @param theme - Optional theme name
 * @returns 16-character hash string
 */
export function generateAttachmentHash(source: string, format: string, theme?: string): string {
  // Implementation...
}
```

### Svelte Guidelines

- Use TypeScript in script blocks
- Prefer composition over inheritance
- Keep components focused and small
- Use semantic HTML elements

```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let value: string;

  const dispatch = createEventDispatcher<{ change: string }>();

  function handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    dispatch('change', target.value);
  }
</script>

<input
  type="text"
  {value}
  on:input={handleInput}
  aria-label="PlantUML source input"
/>
```

### Formatting

- Use Prettier for consistent formatting
- ESLint for code quality
- Pre-commit hooks enforce standards

```bash
# Format code
pnpm fmt

# Lint code
pnpm lint

# Fix linting issues
pnpm lint --fix
```

## 🔍 Code Review Process

### Pull Request Guidelines

1. **Title**: Use conventional commit format
2. **Description**: Explain what and why
3. **Testing**: Include test results
4. **Screenshots**: For UI changes
5. **Breaking Changes**: Document any breaking changes

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)

[Add screenshots for UI changes]

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
```

### Review Criteria

- **Functionality**: Does it work as intended?
- **Code Quality**: Is it readable and maintainable?
- **Performance**: Any performance implications?
- **Security**: Are there security considerations?
- **Tests**: Adequate test coverage?
- **Documentation**: Is documentation updated?

## 🐛 Bug Reports

### Before Reporting

1. Check existing issues
2. Reproduce the bug
3. Test with latest version
4. Gather system information

### Bug Report Template

```markdown
**Bug Description**
Clear description of the bug

**Steps to Reproduce**

1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**

- OS: [e.g., macOS 12.0]
- Browser: [e.g., Chrome 96]
- Confluence Version: [e.g., Cloud]
- App Version: [e.g., 1.2.0]

**Additional Context**
Screenshots, logs, etc.
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Feature Description**
Clear description of the feature

**Use Case**
Why is this feature needed?

**Proposed Solution**
How should it work?

**Alternatives Considered**
Other approaches considered

**Additional Context**
Mockups, examples, etc.
```

## 🏗️ Architecture Guidelines

### Forge App Structure

```
apps/forge-plantuml/
├── src/
│   ├── components/      # Svelte components
│   ├── resolvers/       # Forge resolvers
│   ├── utils/          # Utility functions
│   └── types/          # TypeScript types
├── static/             # Built assets
└── tests/              # Test files
```

### Renderer Service Structure

```
services/renderer/
├── src/
│   ├── handlers/       # Lambda handlers
│   ├── utils/          # Utility functions
│   └── types/          # TypeScript types
├── layers/             # Lambda layers
└── tests/              # Test files
```

### Design Principles

- **Separation of Concerns**: Clear boundaries between components
- **Single Responsibility**: Each module has one purpose
- **Dependency Injection**: Avoid tight coupling
- **Error Handling**: Graceful error handling throughout
- **Security First**: Security considerations in all decisions

## 🚀 Release Process

### Version Numbering

We use [Semantic Versioning](https://semver.org/):

- `MAJOR.MINOR.PATCH`
- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped
- [ ] Security review completed
- [ ] Performance testing completed

### Release Notes Template

```markdown
## [1.2.0] - 2024-01-15

### Added

- New theme support for diagrams
- Keyboard shortcuts for editor

### Changed

- Improved error handling
- Updated dependencies

### Fixed

- Fixed rendering timeout issue
- Resolved CORS configuration

### Security

- Updated JWT validation
- Enhanced input sanitization
```

## 📚 Documentation

### Documentation Types

- **README**: Project overview and setup
- **API Docs**: Generated from code comments
- **User Guide**: End-user documentation
- **Developer Guide**: Technical documentation

### Writing Guidelines

- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Keep documentation up-to-date

## 🤝 Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Email**: security@yourcompany.com (security issues)

### Code of Conduct

We follow the [Contributor Covenant](https://www.contributor-covenant.org/):

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Report unacceptable behavior

## 🎯 Getting Help

### Common Issues

- **Setup Problems**: Check prerequisites and environment
- **Test Failures**: Ensure all dependencies installed
- **Build Errors**: Check Node.js and pnpm versions
- **Forge Issues**: Verify Forge CLI authentication

### Support Channels

1. Check existing GitHub issues
2. Search documentation
3. Ask in GitHub Discussions
4. Contact maintainers

---

**Thank you for contributing!** 🎉

Your contributions help make PlantUML for Confluence better for everyone.
