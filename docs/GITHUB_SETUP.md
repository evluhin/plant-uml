# GitHub CI/CD Setup

## Required Secrets

Go to **Settings → Secrets and variables → Actions**

### Repository Secrets
```
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
FORGE_API_TOKEN=your-forge-api-token
GITHUB_TOKEN=automatically-provided
```

### Repository Variables
```
AWS_REGION=eu-north-1
FORGE_EMAIL=your-email@example.com
RENDERER_URL_DEV=https://your-dev-api.execute-api.region.amazonaws.com/dev
RENDERER_URL_PROD=https://your-prod-api.execute-api.region.amazonaws.com/prod
```

## Environment Protection Rules

### Development Environment
- **No protection rules** (auto-deploy)
- **Reviewers**: None

### Production Environment  
- **Required reviewers**: You
- **Wait timer**: 0 minutes
- **Prevent self-review**: Disabled (since you're solo)

## Branch Protection Rules

### `develop` branch
- **Require pull request reviews**: Disabled (solo developer)
- **Require status checks**: Enable
  - `lint-and-test` (from PR checks)
- **Require up-to-date branches**: Enable

### `main` branch
- **Require pull request reviews**: Enable
  - **Required reviewers**: 1 (you)
  - **Dismiss stale reviews**: Enable
- **Require status checks**: Enable
  - `lint-and-test` (from PR checks)
- **Require up-to-date branches**: Enable
- **Restrict pushes**: Enable (only you)

## Workflow Strategy

### Development Flow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR to develop
git push origin feature/new-feature
# Create PR: feature/new-feature → develop

# After PR merge, auto-deploy to dev happens
```

### Production Flow
```bash
# Create PR from develop to main
# Create PR: develop → main

# After review and merge, auto-deploy to prod happens
# Or trigger manually via GitHub Actions UI
```

## Cost Optimization Tips

### Reduce GitHub Actions usage:
```bash
# Use pre-commit hooks for quick checks
npm install --save-dev husky lint-staged

# Only push when ready
git add .
git commit -m "feat: complete feature"
# Test locally first, then push
```

### Skip CI for docs:
```bash
git commit -m "docs: update readme [skip ci]"
```

### Batch commits:
```bash
# Instead of multiple small commits, batch them:
git add .
git commit -m "feat: implement feature X with tests and docs"
```

## Monitoring Setup

### CloudWatch Alarms (minimal)
```bash
# Create basic health check alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "plantuml-renderer-dev-health" \
  --alarm-description "Health check for dev renderer" \
  --metric-name "HealthCheck" \
  --namespace "AWS/Lambda" \
  --statistic "Average" \
  --period 300 \
  --threshold 1 \
  --comparison-operator "LessThanThreshold"
```

## Troubleshooting

### Common Issues:

#### "AWS credentials not found"
- Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY secrets
- Verify IAM user has Lambda and SAM permissions

#### "Forge login failed"  
- Check FORGE_API_TOKEN is valid
- Verify FORGE_EMAIL matches token owner

#### "SAM deploy failed"
- Check samconfig.toml exists in services/renderer
- Verify AWS region matches

#### "Smoke test failed"
- Check RENDERER_URL_* variables are correct
- Verify Lambda deployed successfully
- Check CloudWatch logs for errors

## Next Steps

1. Set up secrets and variables
2. Configure branch protection
3. Create first feature branch
4. Test the workflow
5. Add more sophisticated tests as needed