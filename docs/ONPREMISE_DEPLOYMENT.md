# On-Premise Deployment Guide

Complete guide for deploying the PlantUML Confluence Cloud system on any AWS account. This guide is parametric — all environment-specific values are represented as variables that you substitute with your own.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Variables Reference](#variables-reference)
- [Prerequisites](#prerequisites)
- [Phase 1: AWS Account Setup](#phase-1-aws-account-setup)
- [Phase 2: Infrastructure Deployment](#phase-2-infrastructure-deployment)
- [Phase 3: Forge App Setup](#phase-3-forge-app-setup)
- [Phase 4: CI/CD Setup](#phase-4-cicd-setup)
- [Verification](#verification)
- [Recovery & Troubleshooting](#recovery--troubleshooting)
- [Cost Estimates](#cost-estimates)

---

## Architecture Overview

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

**Components:**

- **Forge App** — React UI macro for Confluence, deployed to Atlassian's infrastructure
- **AWS Lambda Renderer** — Java 21 function that converts PlantUML source to SVG/PNG
- **Node.js Authorizer** — Lambda function that validates JWT tokens (1-hour API Gateway cache)
- **API Gateway** — HTTP API fronting the renderer with CORS and auth
- **SSM Parameter Store** — Stores JWT secrets (encrypted)

**Flow:** User inserts PlantUML macro → Forge app generates JWT → calls API Gateway → Authorizer validates → Renderer returns SVG.

---

## Variables Reference

Before starting, determine your values for these variables:

| Variable                   | Description                            | Example                              | Required  |
| -------------------------- | -------------------------------------- | ------------------------------------ | --------- |
| `${AWS_REGION}`            | AWS region for deployment              | `eu-north-1`                         | ✅        |
| `${AWS_PROFILE}`           | AWS CLI profile name                   | `plantuml` or `default`              | ✅        |
| `${AWS_ACCOUNT_ID}`        | Your 12-digit AWS account ID           | `123456789012`                       | ✅        |
| `${STACK_NAME_DEV}`        | CloudFormation stack name for dev      | `plantuml-renderer-dev`              | ✅        |
| `${STACK_NAME_PROD}`       | CloudFormation stack name for prod     | `plantuml-renderer-prod`             | ✅        |
| `${JWT_SECRET_PARAM_DEV}`  | SSM parameter path for dev JWT secret  | `/plantuml/renderer/jwt-secret-dev`  | ✅        |
| `${JWT_SECRET_PARAM_PROD}` | SSM parameter path for prod JWT secret | `/plantuml/renderer/jwt-secret-prod` | ✅        |
| `${FORGE_EMAIL}`           | Atlassian account email for Forge      | `you@company.com`                    | ✅        |
| `${FORGE_APP_ID}`          | Forge app ARI (after registration)     | `ari:cloud:ecosystem::app/uuid`      | ✅        |
| `${CONFLUENCE_SITE}`       | Your Confluence Cloud site             | `yoursite.atlassian.net`             | ✅        |
| `${REPO_URL}`              | Git repository URL                     | `https://github.com/org/repo`        | For CI/CD |
| `${CI_IAM_USER}`           | IAM user name for CI/CD                | `github-actions-plantuml`            | For CI/CD |

---

## Prerequisites

### Required Tools

| Tool      | Minimum Version | Check Command     | Install                                                                                                                |
| --------- | --------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Java      | 21+             | `java -version`   | [SDKMAN](https://sdkman.io/) or [Corretto](https://aws.amazon.com/corretto/)                                           |
| Node.js   | 20+             | `node --version`  | [nodejs.org](https://nodejs.org/)                                                                                      |
| npm       | 8+              | `npm --version`   | Comes with Node.js                                                                                                     |
| AWS CLI   | 2.x             | `aws --version`   | [AWS CLI Install](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)                       |
| SAM CLI   | 1.x             | `sam --version`   | [SAM CLI Install](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) |
| Forge CLI | Latest          | `forge --version` | `npm install -g @forge/cli`                                                                                            |
| OpenSSL   | Any             | `openssl version` | Usually pre-installed                                                                                                  |
| curl      | Any             | `curl --version`  | Usually pre-installed                                                                                                  |

### Required Accounts

1. **AWS Account** — With permissions to create Lambda, API Gateway, IAM roles, SSM parameters, S3 buckets, and CloudFormation stacks
2. **Atlassian Account** — With Forge development access (free at [developer.atlassian.com](https://developer.atlassian.com))
3. **Confluence Cloud Instance** — Free or paid tier for testing (create at [atlassian.com](https://www.atlassian.com/software/confluence/free))

### IAM Permissions (Operator)

The operator deploying the system needs these permissions. Attach this policy to your IAM user or role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudFormationFullAccess",
      "Effect": "Allow",
      "Action": "cloudformation:*",
      "Resource": "arn:aws:cloudformation:${AWS_REGION}:${AWS_ACCOUNT_ID}:stack/plantuml-*"
    },
    {
      "Sid": "LambdaManagement",
      "Effect": "Allow",
      "Action": ["lambda:*"],
      "Resource": "arn:aws:lambda:${AWS_REGION}:${AWS_ACCOUNT_ID}:function:plantuml-*"
    },
    {
      "Sid": "LambdaLayerManagement",
      "Effect": "Allow",
      "Action": [
        "lambda:PublishLayerVersion",
        "lambda:GetLayerVersion",
        "lambda:DeleteLayerVersion"
      ],
      "Resource": "arn:aws:lambda:${AWS_REGION}:${AWS_ACCOUNT_ID}:layer:plantuml-*"
    },
    {
      "Sid": "APIGatewayManagement",
      "Effect": "Allow",
      "Action": "apigateway:*",
      "Resource": "*"
    },
    {
      "Sid": "IAMRoleManagement",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:GetRole",
        "iam:GetRolePolicy",
        "iam:PassRole",
        "iam:TagRole",
        "iam:UntagRole"
      ],
      "Resource": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/plantuml-*"
    },
    {
      "Sid": "SSMParameterManagement",
      "Effect": "Allow",
      "Action": [
        "ssm:PutParameter",
        "ssm:GetParameter",
        "ssm:DeleteParameter",
        "ssm:GetParametersByPath"
      ],
      "Resource": "arn:aws:ssm:${AWS_REGION}:${AWS_ACCOUNT_ID}:parameter/plantuml/*"
    },
    {
      "Sid": "S3ArtifactBucket",
      "Effect": "Allow",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::aws-sam-cli-managed-default-*",
        "arn:aws:s3:::aws-sam-cli-managed-default-*/*"
      ]
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:DeleteLogGroup",
        "logs:PutRetentionPolicy",
        "logs:DescribeLogGroups"
      ],
      "Resource": "arn:aws:logs:${AWS_REGION}:${AWS_ACCOUNT_ID}:log-group:/aws/lambda/plantuml-*"
    },
    {
      "Sid": "CloudFormationTransforms",
      "Effect": "Allow",
      "Action": "cloudformation:CreateChangeSet",
      "Resource": "arn:aws:cloudformation:*:aws:transform/Serverless-*"
    }
  ]
}
```

> **Note:** Replace `${AWS_REGION}` and `${AWS_ACCOUNT_ID}` with your actual values. For initial setup you may use AdministratorAccess and then narrow down.

### Verify Prerequisites

```bash
# Check all tools
java -version        # Should be 21+
node --version       # Should be 20+
aws --version        # Should be 2.x
sam --version        # Should be 1.x
forge --version      # Should be latest

# Check AWS credentials
aws sts get-caller-identity --profile ${AWS_PROFILE}
# Expected: returns your account ID and ARN
```

**⏱ Estimated time: 15-30 minutes** (assuming tools are already installed)

---

## Phase 1: AWS Account Setup

### 1.1 Configure AWS CLI Profile

If you don't have an AWS profile configured:

```bash
# Option A: SSO-based (recommended for organizations)
aws configure sso --profile ${AWS_PROFILE}
# Follow prompts: SSO start URL, region, account, role

# Option B: Access key-based
aws configure --profile ${AWS_PROFILE}
# Enter: Access Key ID, Secret Access Key, Region, Output format
```

Verify:

```bash
aws sts get-caller-identity --profile ${AWS_PROFILE}
```

### 1.2 Create JWT Secrets in SSM Parameter Store

These secrets are shared between the Lambda Authorizer and the Forge app to sign/verify JWT tokens.

```bash
# Development secret
aws ssm put-parameter \
  --name "${JWT_SECRET_PARAM_DEV}" \
  --value "$(openssl rand -base64 32)" \
  --type "SecureString" \
  --description "JWT secret for PlantUML renderer - DEV" \
  --profile ${AWS_PROFILE} \
  --region ${AWS_REGION}

# Production secret (MUST be a different value)
aws ssm put-parameter \
  --name "${JWT_SECRET_PARAM_PROD}" \
  --value "$(openssl rand -base64 32)" \
  --type "SecureString" \
  --description "JWT secret for PlantUML renderer - PROD" \
  --profile ${AWS_PROFILE} \
  --region ${AWS_REGION}
```

Verify:

```bash
aws ssm get-parameter \
  --name "${JWT_SECRET_PARAM_DEV}" \
  --profile ${AWS_PROFILE} \
  --region ${AWS_REGION} \
  --query 'Parameter.Name' --output text
# Expected: /plantuml/renderer/jwt-secret-dev

aws ssm get-parameter \
  --name "${JWT_SECRET_PARAM_PROD}" \
  --profile ${AWS_PROFILE} \
  --region ${AWS_REGION} \
  --query 'Parameter.Name' --output text
# Expected: /plantuml/renderer/jwt-secret-prod
```

> ⚠️ If the parameter already exists, add `--overwrite` to rotate the secret. You'll need to re-sync Forge variables afterward.

**⏱ Estimated time: 5-10 minutes**

---

## Phase 2: Infrastructure Deployment

### 2.1 Customize samconfig.toml

Edit `services/renderer/samconfig.toml` to match your environment:

```toml
version = 0.1

[default.global.parameters]
stack_name = "plantuml-renderer"

[default.build.parameters]
cached = true
parallel = true

[default.deploy.parameters]
capabilities = "CAPABILITY_IAM"
confirm_changeset = false
resolve_s3 = true
s3_prefix = "plantuml-renderer"
region = "${AWS_REGION}"
image_repositories = []

[dev.deploy.parameters]
stack_name = "${STACK_NAME_DEV}"
parameter_overrides = "Environment=dev JWTSecretParameter=${JWT_SECRET_PARAM_DEV}"
resolve_s3 = true
s3_prefix = "${STACK_NAME_DEV}"
region = "${AWS_REGION}"
confirm_changeset = false
capabilities = "CAPABILITY_IAM"
image_repositories = []

[prod.deploy.parameters]
stack_name = "${STACK_NAME_PROD}"
parameter_overrides = "Environment=prod JWTSecretParameter=${JWT_SECRET_PARAM_PROD}"
resolve_s3 = true
s3_prefix = "${STACK_NAME_PROD}"
region = "${AWS_REGION}"
confirm_changeset = false
capabilities = "CAPABILITY_IAM"
image_repositories = []
```

### 2.2 Build the Application

```bash
cd services/renderer
sam build --cached
```

> **Note:** Requires Java 17+ for the build (Lambda runs Java 21 in AWS regardless of local build JDK version).

### 2.3 Deploy Development Environment

```bash
AWS_PROFILE=${AWS_PROFILE} sam deploy --config-env dev
```

On first deploy, SAM automatically creates an S3 bucket for artifacts (via `--resolve-s3`).

Retrieve the API Gateway URL:

```bash
DEV_URL=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME_DEV} \
  --query 'Stacks[0].Outputs[?OutputKey==`RendererApiUrl`].OutputValue' \
  --output text \
  --profile ${AWS_PROFILE} \
  --region ${AWS_REGION})
echo "Development API URL: $DEV_URL"
```

Verify:

```bash
curl -s "$DEV_URL/health"
# Expected: {"status":"healthy","timestamp":"..."}
```

### 2.4 Deploy Production Environment

```bash
AWS_PROFILE=${AWS_PROFILE} sam deploy --config-env prod
```

Retrieve the API Gateway URL:

```bash
PROD_URL=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME_PROD} \
  --query 'Stacks[0].Outputs[?OutputKey==`RendererApiUrl`].OutputValue' \
  --output text \
  --profile ${AWS_PROFILE} \
  --region ${AWS_REGION})
echo "Production API URL: $PROD_URL"
```

Verify:

```bash
curl -s "$PROD_URL/health"
# Expected: {"status":"healthy","timestamp":"..."}
```

**⏱ Estimated time: 10-15 minutes** (mostly waiting for CloudFormation)

---

## Phase 3: Forge App Setup

### 3.1 🔧 MANUAL: Register Forge App

> **Why manual:** Forge app registration requires the Atlassian Developer Console web UI. There is no CLI command to create a new app.

1. Go to [developer.atlassian.com/console/myapps](https://developer.atlassian.com/console/myapps/)
2. Click "Create" → "Forge App"
3. Name it (e.g., "PlantUML Confluence Plugin")
4. Copy the App ID (format: `ari:cloud:ecosystem::app/UUID`)

If you're reusing an existing app, find the ID in `apps/forge-plantuml/manifest.yml` under `app.id`.

### 3.2 🔧 MANUAL: Create Forge API Token

> **Why manual:** API tokens are created in the Atlassian security UI and cannot be generated programmatically for security reasons.

1. Go to [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Label: "PlantUML Deployment"
4. Copy the token value (you won't see it again)

### 3.3 Login to Forge CLI

```bash
forge login --email ${FORGE_EMAIL} --token YOUR_API_TOKEN
```

Verify:

```bash
forge whoami
# Expected: Logged in as Your Name (your-email@company.com)
```

### 3.4 Update manifest.yml

Edit `apps/forge-plantuml/manifest.yml`:

- Set `app.id` to your `${FORGE_APP_ID}`
- Update `permissions.external.fetch.backend` addresses with your API Gateway domains:

```yaml
permissions:
  external:
    fetch:
      backend:
        - address: https://YOUR_DEV_API_ID.execute-api.${AWS_REGION}.amazonaws.com
        - address: https://YOUR_PROD_API_ID.execute-api.${AWS_REGION}.amazonaws.com

app:
  id: ${FORGE_APP_ID}
  runtime:
    name: nodejs22.x
```

> Extract the domain from your `$DEV_URL` and `$PROD_URL` (remove the `/dev` or `/prod` path).

### 3.5 Set Forge Environment Variables

```bash
cd apps/forge-plantuml

# Development environment
DEV_SECRET=$(aws ssm get-parameter \
  --name "${JWT_SECRET_PARAM_DEV}" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text \
  --profile ${AWS_PROFILE} \
  --region ${AWS_REGION})

forge variables set RENDERER_URL "$DEV_URL" --environment development
forge variables set RENDERER_JWT_SECRET "$DEV_SECRET" --environment development

# Production environment
PROD_SECRET=$(aws ssm get-parameter \
  --name "${JWT_SECRET_PARAM_PROD}" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text \
  --profile ${AWS_PROFILE} \
  --region ${AWS_REGION})

forge variables set RENDERER_URL "$PROD_URL" --environment production
forge variables set RENDERER_JWT_SECRET "$PROD_SECRET" --environment production
```

Verify:

```bash
forge variables list --environment development
forge variables list --environment production
# Expected: RENDERER_URL and RENDERER_JWT_SECRET set for each
```

### 3.6 Deploy Forge App

```bash
cd apps/forge-plantuml

# Deploy to development
forge deploy --environment development --no-verify

# Deploy to production
forge deploy --environment production --no-verify
```

### 3.7 🔧 MANUAL: Install Forge App in Confluence

> **Why manual:** The `forge install` command requires interactive site selection. It cannot be fully automated.

```bash
cd apps/forge-plantuml
forge install --product confluence --environment development
# When prompted, enter: ${CONFLUENCE_SITE}
# Confirm the permissions prompt
```

For production:

```bash
forge install --product confluence --environment production
# Enter: ${CONFLUENCE_SITE}
```

**⏱ Estimated time: 15-20 minutes**

---

## Phase 4: CI/CD Setup

### GitHub Actions

The project includes GitHub Actions workflows in `.github/workflows/`. To enable them:

#### 4.1 🔧 MANUAL: Create CI/CD IAM User

> **Why manual:** Creating IAM users with programmatic access is a security-sensitive operation that should be done deliberately.

```bash
# Create IAM user
aws iam create-user --user-name ${CI_IAM_USER} --profile ${AWS_PROFILE}

# Attach the CI/CD policy (see docs/iam-cicd-policy.json)
aws iam put-user-policy \
  --user-name ${CI_IAM_USER} \
  --policy-name plantuml-cicd-deploy \
  --policy-document file://docs/iam-cicd-policy.json \
  --profile ${AWS_PROFILE}

# Create access keys
aws iam create-access-key --user-name ${CI_IAM_USER} --profile ${AWS_PROFILE}
# Save the AccessKeyId and SecretAccessKey - shown only once!
```

#### 4.2 🔧 MANUAL: Configure GitHub Secrets

> **Why manual:** GitHub Secrets must be set through the UI or `gh` CLI with authentication. They cannot be committed to code.

```bash
# Using gh CLI (if installed and authenticated)
gh secret set AWS_ACCESS_KEY_ID --body "YOUR_ACCESS_KEY" --repo ${REPO_URL}
gh secret set AWS_SECRET_ACCESS_KEY --body "YOUR_SECRET_KEY" --repo ${REPO_URL}
gh secret set FORGE_API_TOKEN --body "YOUR_FORGE_TOKEN" --repo ${REPO_URL}
```

Or via GitHub UI: Repository → Settings → Secrets and variables → Actions → New repository secret

#### 4.3 Configure GitHub Variables

```bash
gh variable set AWS_REGION --body "${AWS_REGION}" --repo ${REPO_URL}
gh variable set FORGE_EMAIL --body "${FORGE_EMAIL}" --repo ${REPO_URL}
gh variable set RENDERER_URL_DEV --body "$DEV_URL" --repo ${REPO_URL}
gh variable set RENDERER_URL_PROD --body "$PROD_URL" --repo ${REPO_URL}
```

#### Required GitHub Secrets

| Secret                  | Description               | Source          |
| ----------------------- | ------------------------- | --------------- |
| `AWS_ACCESS_KEY_ID`     | CI/CD IAM user access key | Step 4.1 output |
| `AWS_SECRET_ACCESS_KEY` | CI/CD IAM user secret key | Step 4.1 output |
| `FORGE_API_TOKEN`       | Atlassian Forge API token | Step 3.2        |

#### Required GitHub Variables

| Variable            | Description          | Value               |
| ------------------- | -------------------- | ------------------- |
| `AWS_REGION`        | Deployment region    | `${AWS_REGION}`     |
| `FORGE_EMAIL`       | Forge account email  | `${FORGE_EMAIL}`    |
| `RENDERER_URL_DEV`  | Dev API Gateway URL  | Output from Phase 2 |
| `RENDERER_URL_PROD` | Prod API Gateway URL | Output from Phase 2 |

#### Workflow Behavior

| Workflow                      | Trigger                              | Description                     |
| ----------------------------- | ------------------------------------ | ------------------------------- |
| `ci.yml`                      | Push to master, PR to master/develop | Lint, test, build validation    |
| `deploy-development.yml`      | Push to develop                      | Auto-deploy to dev environment  |
| `deploy-production.yml`       | Manual (workflow_dispatch)           | Deploy to production            |
| `deploy-production-forge.yml` | Manual (workflow_dispatch)           | Deploy only Forge to production |
| `security.yml`                | Weekly + push/PR to master           | npm audit + CodeQL analysis     |

### GitLab CI/CD

If using GitLab instead of GitHub, see `docs/gitlab-ci-example.yml` for a complete pipeline configuration.

#### Required GitLab CI/CD Variables

Configure in: Settings → CI/CD → Variables

| Variable                | Type     | Protected | Masked | Value                 |
| ----------------------- | -------- | --------- | ------ | --------------------- |
| `AWS_ACCESS_KEY_ID`     | Variable | ✅        | ✅     | CI/CD IAM user key    |
| `AWS_SECRET_ACCESS_KEY` | Variable | ✅        | ✅     | CI/CD IAM user secret |
| `FORGE_API_TOKEN`       | Variable | ✅        | ✅     | Atlassian API token   |
| `AWS_REGION`            | Variable | ❌        | ❌     | `${AWS_REGION}`       |
| `FORGE_EMAIL`           | Variable | ❌        | ❌     | `${FORGE_EMAIL}`      |
| `RENDERER_URL_DEV`      | Variable | ❌        | ❌     | Dev API URL           |
| `RENDERER_URL_PROD`     | Variable | ❌        | ❌     | Prod API URL          |

**⏱ Estimated time: 15-20 minutes**

---

## Verification

After completing all phases, run these checks:

### Health Checks

```bash
# Dev environment
curl -s "$DEV_URL/health"
# Expected: {"status":"healthy","timestamp":"..."}

# Prod environment
curl -s "$PROD_URL/health"
# Expected: {"status":"healthy","timestamp":"..."}
```

### JWT Authentication Test

```bash
# Generate a test token and render a diagram
DEV_SECRET=$(aws ssm get-parameter \
  --name "${JWT_SECRET_PARAM_DEV}" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text \
  --profile ${AWS_PROFILE} \
  --region ${AWS_REGION})

TOKEN=$(node -e "const jwt=require('jsonwebtoken');console.log(jwt.sign({sub:'test'},process.env.S,{expiresIn:'60s'}))" S="$DEV_SECRET")

curl -s -X POST "$DEV_URL/render" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"source":"@startuml\nAlice -> Bob: Hello\n@enduml","format":"svg"}' \
  | head -c 200
# Expected: SVG content starting with <?xml
```

### Forge App Test

1. Open `https://${CONFLUENCE_SITE}/wiki`
2. Create or edit a page
3. Type `/` and search for "PlantUML"
4. Add the PlantUML macro
5. Enter test diagram:
   ```
   @startuml
   Alice -> Bob: Hello
   Bob -> Alice: Hi there!
   @enduml
   ```
6. Save and verify the diagram renders as an SVG image

### CloudFormation Stack Status

```bash
aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME_DEV} \
  --query 'Stacks[0].StackStatus' \
  --output text \
  --profile ${AWS_PROFILE} \
  --region ${AWS_REGION}
# Expected: CREATE_COMPLETE or UPDATE_COMPLETE

aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME_PROD} \
  --query 'Stacks[0].StackStatus' \
  --output text \
  --profile ${AWS_PROFILE} \
  --region ${AWS_REGION}
# Expected: CREATE_COMPLETE or UPDATE_COMPLETE
```

---

## Recovery & Troubleshooting

### Recovery Checklist

If you're returning to a broken deployment, check these in order:

```bash
# 1. AWS credentials valid?
aws sts get-caller-identity --profile ${AWS_PROFILE}

# 2. Stacks exist?
aws cloudformation describe-stacks --stack-name ${STACK_NAME_DEV} --profile ${AWS_PROFILE} --region ${AWS_REGION} --query 'Stacks[0].StackStatus'
aws cloudformation describe-stacks --stack-name ${STACK_NAME_PROD} --profile ${AWS_PROFILE} --region ${AWS_REGION} --query 'Stacks[0].StackStatus'

# 3. SSM secrets exist?
aws ssm get-parameter --name "${JWT_SECRET_PARAM_DEV}" --profile ${AWS_PROFILE} --region ${AWS_REGION}
aws ssm get-parameter --name "${JWT_SECRET_PARAM_PROD}" --profile ${AWS_PROFILE} --region ${AWS_REGION}

# 4. Forge CLI authenticated?
forge whoami

# 5. Health endpoints respond?
curl -s "$DEV_URL/health"
curl -s "$PROD_URL/health"

# 6. Forge variables correct?
cd apps/forge-plantuml
forge variables list --environment development
forge variables list --environment production
```

### Common Issues

#### "Stack does not exist" or Stack in ROLLBACK_COMPLETE

**Symptoms:** `sam deploy` fails, or `describe-stacks` shows ROLLBACK_COMPLETE.

**Cause:** Previous deployment failed and stack is stuck.

**Resolution:**

```bash
# Delete the failed stack
aws cloudformation delete-stack \
  --stack-name ${STACK_NAME_DEV} \
  --profile ${AWS_PROFILE} \
  --region ${AWS_REGION}

# Wait for deletion (up to 5 minutes)
aws cloudformation wait stack-delete-complete \
  --stack-name ${STACK_NAME_DEV} \
  --profile ${AWS_PROFILE} \
  --region ${AWS_REGION}

# Redeploy
cd services/renderer
sam build --cached
AWS_PROFILE=${AWS_PROFILE} sam deploy --config-env dev
```

#### "Export already exists" CloudFormation Error

**Symptoms:** Deploy fails with "Export plantuml-renderer-url-dev already exists".

**Cause:** Another stack in the same account uses the same export name.

**Resolution:** Change your `${STACK_NAME_DEV}` to a unique name, or delete the conflicting stack.

#### JWT Verification Failed (403 from API Gateway)

**Symptoms:** Render requests return 403, health check works fine.

**Cause:** JWT secret mismatch between SSM (what authorizer reads) and Forge variable (what app uses to sign).

**Resolution:**

```bash
# Re-sync: get the SSM secret value and update Forge
DEV_SECRET=$(aws ssm get-parameter \
  --name "${JWT_SECRET_PARAM_DEV}" \
  --with-decryption \
  --query 'Parameter.Value' --output text \
  --profile ${AWS_PROFILE} --region ${AWS_REGION})

cd apps/forge-plantuml
forge variables set RENDERER_JWT_SECRET "$DEV_SECRET" --environment development
forge deploy --environment development --no-verify
```

#### Forge CLI Login Failed

**Symptoms:** `forge whoami` shows error, or deploy fails with authentication error.

**Cause:** API token expired or was revoked.

**Resolution:**

1. Generate a new token at [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Re-login: `forge login --email ${FORGE_EMAIL} --token NEW_TOKEN`

#### SAM Deploy Permissions Error

**Symptoms:** Deploy fails with "AccessDenied" or "is not authorized to perform".

**Cause:** IAM user/role lacks required permissions.

**Resolution:** Compare your IAM policy against the [Prerequisites IAM Policy](#iam-permissions-operator) above. Add missing permissions.

#### Lambda Cold Start Timeout

**Symptoms:** First request after idle period takes >30s and times out.

**Cause:** Java 21 Lambda cold start with SnapStart may still be ~5s; if Graphviz layer is missing, rendering fails.

**Resolution:**

- Verify PlantUML layer deployed: check CloudFormation stack resources
- Increase timeout in `template.yaml` if needed (default is 30s)
- Check CloudWatch logs: `sam logs --name plantuml-renderer-dev --tail --profile ${AWS_PROFILE}`

#### API Gateway Returns 401 on Health Endpoint

**Symptoms:** Even the `/health` endpoint requires auth.

**Cause:** Health endpoint should be unauthenticated. Check `template.yaml` — the HealthApi event should NOT have `Auth.Authorizer` set.

**Resolution:** The current template correctly omits auth on `/health`. If you've modified it, ensure the HealthApi event has no `Auth` block.

---

## Cost Estimates

### AWS Monthly Costs (estimated)

| Resource            | Development     | Production       |
| ------------------- | --------------- | ---------------- |
| Lambda (renderer)   | ~$1-3           | ~$3-10           |
| Lambda (authorizer) | ~$0.50          | ~$1              |
| API Gateway         | ~$0.50          | ~$1-3            |
| CloudWatch Logs     | ~$0.10          | ~$0.50           |
| SSM Parameter Store | Free            | Free             |
| S3 (artifacts)      | ~$0.01          | ~$0.01           |
| **Total**           | **~$2-5/month** | **~$5-15/month** |

Costs depend on usage volume. For a team of 10-50 developers, expect the lower end. The main cost driver is Lambda invocations for rendering.

### Free Tier Considerations

- Lambda: 1M free requests/month, 400,000 GB-seconds
- API Gateway: 1M HTTP API calls/month free (first 12 months)
- For light usage, costs may be near zero during the first year

---

## Related Documentation

- [SETUP.md](../SETUP.md) — Quick setup for returning developers
- [SECURITY.md](../SECURITY.md) — Security architecture and threat model
- [DEVELOPMENT.md](../DEVELOPMENT.md) — Development workflow
- [docs/JAVA21_PERFORMANCE.md](./JAVA21_PERFORMANCE.md) — Performance benchmarks
- [docs/gitlab-ci-example.yml](./gitlab-ci-example.yml) — GitLab CI/CD pipeline example
- [docs/iam-cicd-policy.json](./iam-cicd-policy.json) — Minimal IAM policy for CI/CD
