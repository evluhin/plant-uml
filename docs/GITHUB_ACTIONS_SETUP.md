# GitHub Actions CI/CD Setup

## Overview

The project uses GitHub Actions for continuous integration and deployment with three main workflows:

1. **CI** (`ci.yml`) - Runs on every push/PR
2. **Deploy to Staging** (`deploy-staging.yml`) - Auto-deploys after successful CI
3. **Deploy to Production** (`deploy-production.yml`) - Manual deployment with confirmation

## Required Secrets

Configure these secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

### AWS Credentials
```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

### Forge Configuration
```
FORGE_EMAIL=your-email@example.com
FORGE_API_TOKEN=ATATT3xFfGF0...
FORGE_ENV_STG=staging
FORGE_ENV_PROD=production
```

### Renderer Configuration
```
RENDERER_JWT_SECRET_PARAM=/plantuml/renderer/jwt-secret
RENDERER_JWT_SECRET=your-base64-jwt-secret
```

## Workflow Details

### CI Workflow
**Triggers**: Push to `main`/`develop`, Pull Requests
**Jobs**:
- `lint` - ESLint and code formatting checks
- `test` - Unit tests with coverage reporting
- `test-e2e` - Playwright end-to-end tests
- `build` - Build both Forge app and SAM application

### Staging Deployment
**Triggers**: After successful CI on `main`/`develop`
**Jobs**:
- `deploy-renderer` - Deploy AWS Lambda renderer to staging
- `deploy-forge` - Deploy Forge app to staging environment
- `test-staging` - Run integration tests against staging

### Production Deployment
**Triggers**: Manual workflow dispatch only
**Requirements**: Must type "deploy" to confirm
**Jobs**:
- `validate-input` - Confirms deployment intention
- `deploy-renderer` - Deploy AWS Lambda renderer to production
- `deploy-forge` - Deploy Forge app to production environment
- `test-production` - Run integration tests against production

## Environment Protection

Production deployments use GitHub Environment protection rules:
- Manual approval required
- Restricted to specific branches
- Environment-specific secrets

## Monitoring

### Build Status
- CI status visible on PRs and commits
- Coverage reports uploaded to Codecov
- Test results and artifacts preserved

### Deployment Status
- Deployment status tracked in GitHub Environments
- Failed deployments trigger notifications
- Rollback capabilities through re-running workflows

## Usage

### Automatic Deployments
1. Push to `main` or `develop` branch
2. CI workflow runs automatically
3. On success, staging deployment triggers
4. Staging environment updated automatically

### Production Deployments
1. Go to Actions tab in GitHub
2. Select "Deploy to Production" workflow
3. Click "Run workflow"
4. Type "deploy" in confirmation field
5. Click "Run workflow" button

### Monitoring Deployments
1. Check Actions tab for workflow status
2. View deployment logs in workflow runs
3. Monitor environments in repository settings
4. Check AWS CloudWatch for runtime logs

## Troubleshooting

### Common Issues

#### "AWS credentials not configured"
- Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` secrets
- Check IAM permissions for deployment

#### "Forge authentication failed"
- Verify `FORGE_API_TOKEN` is valid and not expired
- Check `FORGE_EMAIL` matches token owner

#### "SAM build failed"
- Check Node.js version compatibility
- Verify dependencies in package.json

#### "Deployment timeout"
- Check AWS service limits
- Verify CloudFormation stack status

### Debug Steps
1. Check workflow logs in Actions tab
2. Verify all required secrets are set
3. Test deployment locally with same parameters
4. Check AWS CloudWatch logs for runtime errors

## Migration from GitLab CI

### Completed Changes
- ✅ Converted `.gitlab-ci.yml` to GitHub Actions workflows
- ✅ Updated documentation references
- ✅ Migrated environment variables to GitHub secrets
- ✅ Added environment protection for production

### Manual Steps Required
1. Configure GitHub repository secrets (see above)
2. Set up GitHub Environments for production protection
3. Configure branch protection rules if needed
4. Update any external integrations pointing to GitLab CI