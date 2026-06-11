---
inclusion: manual
---

# PlantUML Confluence — Interactive Deployment Guide

You are guiding an operator through deploying the PlantUML Confluence Cloud system on their AWS account. Follow this structured approach, adapting commands to the operator's environment.

Reference document: #[[file:docs/ONPREMISE_DEPLOYMENT.md]]

## Context Variables to Collect

Before starting, collect these from the operator:

- `AWS_REGION` — Which AWS region? (default: eu-north-1)
- `AWS_PROFILE` — AWS CLI profile name? (default: default)
- `CI_PLATFORM` — CI/CD platform? (GitHub Actions / GitLab CI/CD / Both / None)
- `CONFLUENCE_SITE` — Confluence site URL? (e.g., yoursite.atlassian.net)

## Phase 0: Environment Detection

Before proceeding, automatically detect the current state by running these checks:

```bash
# 1. Check AWS credentials
aws sts get-caller-identity --profile ${AWS_PROFILE}

# 2. Check existing CloudFormation stacks
aws cloudformation describe-stacks --stack-name plantuml-renderer-dev --profile ${AWS_PROFILE} --region ${AWS_REGION} 2>&1
aws cloudformation describe-stacks --stack-name plantuml-renderer-prod --profile ${AWS_PROFILE} --region ${AWS_REGION} 2>&1

# 3. Check SSM parameters
aws ssm get-parameter --name "/plantuml/renderer/jwt-secret-dev" --profile ${AWS_PROFILE} --region ${AWS_REGION} 2>&1
aws ssm get-parameter --name "/plantuml/renderer/jwt-secret-prod" --profile ${AWS_PROFILE} --region ${AWS_REGION} 2>&1

# 4. Check Forge CLI
forge whoami 2>&1
```

Based on results, determine the scenario:

- **Fresh Install** — No stacks, no SSM params → start from Phase 1
- **Recovery** — Stacks in ROLLBACK_COMPLETE, or missing SSM params → fix issues, then resume
- **Update** — Stacks in CREATE_COMPLETE/UPDATE_COMPLETE → deploy updates only
- **Credential Refresh** — AWS or Forge credentials expired → re-authenticate first

Report the detected state to the operator and propose the appropriate flow.

## Phase 1: Prerequisites

### Entry Conditions

- Operator has terminal access
- AWS account exists

### Steps

1. Check all required tools are installed:
   ```bash
   java -version && node --version && aws --version && sam --version && forge --version
   ```
2. If any tool is missing, provide installation instructions from the deployment guide
3. Verify AWS credentials work:
   ```bash
   aws sts get-caller-identity --profile ${AWS_PROFILE}
   ```
4. If credentials fail:
   - For SSO: `aws sso login --profile ${AWS_PROFILE}`
   - For access keys: `aws configure --profile ${AWS_PROFILE}`

### Exit Conditions

- All tools installed with correct versions (Java 21+, Node 20+)
- AWS credentials return valid caller identity
- Forge CLI responds to `forge whoami` or operator has token ready

## Phase 2: Secrets Setup

### Entry Conditions

- AWS credentials validated
- Region confirmed

### Steps

1. Check if JWT secrets already exist:
   ```bash
   aws ssm get-parameter --name "/plantuml/renderer/jwt-secret-dev" --profile ${AWS_PROFILE} --region ${AWS_REGION} 2>&1
   aws ssm get-parameter --name "/plantuml/renderer/jwt-secret-prod" --profile ${AWS_PROFILE} --region ${AWS_REGION} 2>&1
   ```
2. If secrets DON'T exist — create them:
   ```bash
   aws ssm put-parameter --name "/plantuml/renderer/jwt-secret-dev" --value "$(openssl rand -base64 32)" --type "SecureString" --description "JWT secret for PlantUML renderer - DEV" --profile ${AWS_PROFILE} --region ${AWS_REGION}
   aws ssm put-parameter --name "/plantuml/renderer/jwt-secret-prod" --value "$(openssl rand -base64 32)" --type "SecureString" --description "JWT secret for PlantUML renderer - PROD" --profile ${AWS_PROFILE} --region ${AWS_REGION}
   ```
3. If secrets already exist — inform operator and skip (unless they want to rotate)

### Exit Conditions

- Both SSM parameters exist and are accessible
- Verify: `aws ssm get-parameter --name "/plantuml/renderer/jwt-secret-dev" --profile ${AWS_PROFILE} --region ${AWS_REGION} --query 'Parameter.Name'`

## Phase 3: Infrastructure Deployment

### Entry Conditions

- Secrets exist in SSM
- AWS credentials valid

### Steps

1. Check existing stack state:
   ```bash
   aws cloudformation describe-stacks --stack-name plantuml-renderer-dev --profile ${AWS_PROFILE} --region ${AWS_REGION} --query 'Stacks[0].StackStatus' 2>&1
   ```
2. If stack is in ROLLBACK_COMPLETE → delete it first:
   ```bash
   aws cloudformation delete-stack --stack-name plantuml-renderer-dev --profile ${AWS_PROFILE} --region ${AWS_REGION}
   aws cloudformation wait stack-delete-complete --stack-name plantuml-renderer-dev --profile ${AWS_PROFILE} --region ${AWS_REGION}
   ```
3. Verify `services/renderer/samconfig.toml` has correct region and parameter paths
4. Build and deploy:
   ```bash
   cd services/renderer
   sam build --cached
   AWS_PROFILE=${AWS_PROFILE} sam deploy --config-env dev
   AWS_PROFILE=${AWS_PROFILE} sam deploy --config-env prod
   ```
5. Retrieve API URLs:
   ```bash
   DEV_URL=$(aws cloudformation describe-stacks --stack-name plantuml-renderer-dev --query 'Stacks[0].Outputs[?OutputKey==`RendererApiUrl`].OutputValue' --output text --profile ${AWS_PROFILE} --region ${AWS_REGION})
   PROD_URL=$(aws cloudformation describe-stacks --stack-name plantuml-renderer-prod --query 'Stacks[0].Outputs[?OutputKey==`RendererApiUrl`].OutputValue' --output text --profile ${AWS_PROFILE} --region ${AWS_REGION})
   echo "Dev: $DEV_URL"
   echo "Prod: $PROD_URL"
   ```
6. Health check:
   ```bash
   curl -s "$DEV_URL/health"
   curl -s "$PROD_URL/health"
   ```

### Exit Conditions

- Both stacks in CREATE_COMPLETE or UPDATE_COMPLETE
- Both health endpoints return `{"status":"healthy",...}`
- DEV_URL and PROD_URL captured for next phase

## Phase 4: Forge App Setup

### Entry Conditions

- Infrastructure deployed and healthy
- API URLs known
- Forge CLI authenticated

### Steps

1. If NOT logged in to Forge, ask operator for their API token (manual step — created at Atlassian security page)
2. Update `apps/forge-plantuml/manifest.yml`:
   - Set `app.id` to operator's Forge app ID
   - Update `permissions.external.fetch.backend` with new API Gateway domains
3. Set Forge variables:
   ```bash
   cd apps/forge-plantuml
   DEV_SECRET=$(aws ssm get-parameter --name "/plantuml/renderer/jwt-secret-dev" --with-decryption --query 'Parameter.Value' --output text --profile ${AWS_PROFILE} --region ${AWS_REGION})
   PROD_SECRET=$(aws ssm get-parameter --name "/plantuml/renderer/jwt-secret-prod" --with-decryption --query 'Parameter.Value' --output text --profile ${AWS_PROFILE} --region ${AWS_REGION})
   forge variables set RENDERER_URL "$DEV_URL" --environment development
   forge variables set RENDERER_JWT_SECRET "$DEV_SECRET" --environment development
   forge variables set RENDERER_URL "$PROD_URL" --environment production
   forge variables set RENDERER_JWT_SECRET "$PROD_SECRET" --environment production
   ```
4. Deploy:
   ```bash
   forge deploy --environment development --no-verify
   forge deploy --environment production --no-verify
   ```
5. Install (MANUAL — requires interactive site selection):
   ```bash
   forge install --product confluence --environment development
   # Operator enters their site URL when prompted
   ```

### Exit Conditions

- `forge variables list --environment development` shows correct URL and secret
- `forge variables list --environment production` shows correct URL and secret
- App deployed and installed on at least one Confluence site

## Phase 5: CI/CD Setup (Optional)

### Entry Conditions

- Infrastructure and Forge fully deployed
- Operator chose a CI platform

### Steps for GitHub Actions

1. Create CI/CD IAM user (manual — security-sensitive):
   ```bash
   aws iam create-user --user-name ${CI_IAM_USER} --profile ${AWS_PROFILE}
   aws iam put-user-policy --user-name ${CI_IAM_USER} --policy-name plantuml-cicd-deploy --policy-document file://docs/iam-cicd-policy.json --profile ${AWS_PROFILE}
   aws iam create-access-key --user-name ${CI_IAM_USER} --profile ${AWS_PROFILE}
   ```
2. Configure GitHub secrets (manual or via `gh` CLI):
   ```bash
   gh secret set AWS_ACCESS_KEY_ID --body "KEY_FROM_ABOVE"
   gh secret set AWS_SECRET_ACCESS_KEY --body "SECRET_FROM_ABOVE"
   gh secret set FORGE_API_TOKEN --body "FORGE_TOKEN"
   gh variable set AWS_REGION --body "${AWS_REGION}"
   gh variable set FORGE_EMAIL --body "${FORGE_EMAIL}"
   gh variable set RENDERER_URL_DEV --body "$DEV_URL"
   gh variable set RENDERER_URL_PROD --body "$PROD_URL"
   ```

### Steps for GitLab CI/CD

1. Copy `docs/gitlab-ci-example.yml` to `.gitlab-ci.yml` in repo root
2. Configure GitLab CI/CD variables in Settings → CI/CD → Variables
3. Same IAM user and secrets as GitHub, just entered in GitLab UI

### Exit Conditions

- All secrets/variables configured in CI platform
- Push to develop triggers pipeline (or manual trigger works)

## Phase 6: Verification

### Entry Conditions

- All previous phases complete

### Steps

1. Health check both environments
2. JWT render test:
   ```bash
   DEV_SECRET=$(aws ssm get-parameter --name "/plantuml/renderer/jwt-secret-dev" --with-decryption --query 'Parameter.Value' --output text --profile ${AWS_PROFILE} --region ${AWS_REGION})
   TOKEN=$(node -e "const jwt=require('jsonwebtoken');console.log(jwt.sign({sub:'test'},process.env.S,{expiresIn:'60s'}))" S="$DEV_SECRET")
   curl -s -X POST "$DEV_URL/render" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"source":"@startuml\nAlice -> Bob: Hello\n@enduml","format":"svg"}' | head -c 100
   ```
3. Ask operator to test in Confluence UI (add PlantUML macro to a page)
4. If CI/CD configured — verify pipeline runs on a test push

### Exit Conditions

- SVG returned from render endpoint
- Diagram visible in Confluence
- Pipeline green (if configured)

## Error Handling

When any step fails:

1. Show the error output
2. Look up the error in the "Recovery & Troubleshooting" section of the deployment guide
3. Suggest the specific resolution
4. After fix, re-run the verification for that phase before proceeding

Common patterns:

- **AWS credential expired** → `aws sso login --profile ${AWS_PROFILE}` or reconfigure
- **Stack ROLLBACK_COMPLETE** → delete stack, wait, redeploy
- **SSM ParameterNotFound** → recreate with `put-parameter`
- **Forge 401** → re-login with fresh API token
- **JWT 403** → re-sync secrets between SSM and Forge variables, redeploy Forge
- **Health 5xx** → check CloudWatch logs: `sam logs --name plantuml-renderer-dev --tail --profile ${AWS_PROFILE}`

## Platform-Specific Notes

### macOS

- Java via SDKMAN: `sdk install java 21.0.5-zulu`
- AWS CLI via brew: `brew install awscli`
- SAM CLI via brew: `brew install aws-sam-cli`

### Linux (Ubuntu/Debian)

- Java via apt: `apt install openjdk-21-jdk` or SDKMAN
- AWS CLI: download from AWS docs
- SAM CLI: download from AWS docs

### Windows (WSL2 recommended)

- Use WSL2 with Ubuntu for best compatibility
- All commands work identically in WSL2 terminal
