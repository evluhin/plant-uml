# Requirements Document

## Introduction

This document defines the requirements for creating a universal on-premise deployment guide and an interactive AI steering skill for the PlantUML Confluence Cloud system. The goal is to enable any operator with access to the source code and an AWS account to deploy the complete system independently, without reliance on a specific environment's hardcoded values.

## Glossary

- **Operator**: A person deploying the PlantUML Confluence system on their own AWS account
- **Parametric Variable**: A placeholder value (e.g., `${AWS_REGION}`) that the operator substitutes with their environment-specific value
- **Steering Skill**: A Kiro AI instruction file that enables interactive guided deployment
- **Fresh Install**: Deploying to an AWS account with no existing PlantUML infrastructure
- **Recovery**: Restoring a deployment after credential loss, stack failures, or account changes

## Requirements

### Requirement 1: Parametric Variables System

The guide MUST use placeholder variables instead of hardcoded values for all environment-specific configuration.

**User Story:** As an operator deploying to my own AWS account, I want all commands to use placeholder variables so I can substitute my own values without editing the guide.

#### Acceptance Criteria

- Guide contains a "Variables Reference" table listing all parametric variables with name, description, example value, and whether required
- No hardcoded AWS account IDs, API Gateway URLs, or Forge app IDs appear in any command
- All commands use `${VARIABLE}` syntax that operators can substitute with their values
- Variables include at least: AWS_REGION, AWS_PROFILE, STACK_NAME_DEV, STACK_NAME_PROD, JWT_SECRET_PARAM_DEV, JWT_SECRET_PARAM_PROD, FORGE_APP_ID, FORGE_EMAIL

### Requirement 2: Prerequisites Documentation

The guide MUST document all prerequisites including required tools with minimum versions, required accounts, and required IAM permissions.

**User Story:** As an operator starting from scratch, I want to know exactly what tools and accounts I need before beginning deployment so I don't get stuck mid-process.

#### Acceptance Criteria

- Lists all required CLI tools: Java 21+, Node.js 20+, AWS CLI v2, SAM CLI, Forge CLI
- Provides version check commands for each tool
- Documents minimum IAM permissions needed (CloudFormation, Lambda, API Gateway, IAM, SSM, S3, CloudWatch Logs)
- Provides an IAM policy JSON that operators can attach to their deployment user/role
- Documents required external accounts: AWS account, Atlassian account with Forge access, Confluence Cloud instance

### Requirement 3: AWS Infrastructure Deployment Instructions

The guide MUST provide complete instructions for deploying the AWS infrastructure on a fresh account.

**User Story:** As an operator with a fresh AWS account, I want step-by-step instructions to deploy all AWS resources so the PlantUML renderer is fully operational.

#### Acceptance Criteria

- Covers JWT secret creation in SSM Parameter Store for both dev and prod environments
- Provides SAM build and deploy commands with `--config-env` for environment selection
- Explains how to retrieve the API Gateway URL from CloudFormation outputs
- Handles the case where `samconfig.toml` needs to be customized for a new account
- Includes health check verification after deployment
- Documents the `--resolve-s3` flag for automatic S3 bucket management

### Requirement 4: Forge App Setup Instructions

The guide MUST provide complete instructions for registering, configuring, and deploying the Atlassian Forge app.

**User Story:** As an operator with a new Atlassian account, I want clear instructions to register and deploy the Forge app so it connects to my AWS renderer.

#### Acceptance Criteria

- Explains how to register a new Forge app or reuse existing app ID
- Documents how to obtain a Forge API token from Atlassian
- Covers `forge variables set` for RENDERER_URL and RENDERER_JWT_SECRET in both environments
- Provides `forge deploy` commands for development and production
- Covers `forge install` for installing the app on a Confluence site
- Explains how to update `manifest.yml` external fetch URLs with new API Gateway URLs

### Requirement 5: Manual Steps Identification

The guide MUST clearly identify all steps requiring manual human action with explanations of why they cannot be automated.

**User Story:** As an operator, I want to clearly see which steps require my manual action so I can plan my time and know what cannot be scripted.

#### Acceptance Criteria

- Each manual step is visually marked with a 🔧 MANUAL label
- Each manual step includes an explanation of WHY it cannot be automated
- Manual steps include at minimum: Forge app registration in Developer Console, `forge install` site selection, CI/CD secret creation in platform UI, IAM user/role creation
- Automated steps are clearly distinguished from manual steps

### Requirement 6: Recovery and Update Scenarios

The guide MUST handle scenarios where infrastructure partially exists including failed stacks, expired credentials, and missing secrets.

**User Story:** As an operator returning to a broken deployment, I want recovery procedures so I can restore the system without starting over.

#### Acceptance Criteria

- Documents how to check existing CloudFormation stack status
- Provides recovery steps for ROLLBACK_COMPLETE stacks (delete + redeploy)
- Handles UPDATE_COMPLETE stacks (deploy as update)
- Covers SSM parameter recreation if secrets are lost
- Explains Forge variable re-sync when API URLs change
- Provides a "Recovery Checklist" section for common failure scenarios

### Requirement 7: GitHub Actions CI/CD Documentation

The guide MUST document the complete GitHub Actions CI/CD setup including required secrets, variables, and workflow behavior.

**User Story:** As an operator using GitHub, I want to configure automated deployments so code changes are deployed without manual intervention.

#### Acceptance Criteria

- Lists all required GitHub Secrets: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, FORGE_API_TOKEN
- Lists all required GitHub Variables: AWS_REGION, FORGE_EMAIL, RENDERER_URL_DEV, RENDERER_URL_PROD
- Explains the development auto-deploy workflow (triggers on push to develop)
- Explains the production manual-trigger workflow
- Documents how to create an IAM user specifically for CI/CD with minimal permissions
- Provides `gh` CLI commands for setting secrets/variables where possible

### Requirement 8: GitLab CI/CD Pipeline Configuration

The guide MUST provide a complete `.gitlab-ci.yml` configuration functionally equivalent to existing GitHub Actions workflows.

**User Story:** As an operator using GitLab instead of GitHub, I want an equivalent CI/CD pipeline so I can deploy automatically from my GitLab repository.

#### Acceptance Criteria

- Provides a working `.gitlab-ci.yml` file with stages: lint, test, build, deploy-dev, deploy-prod
- Dev deployment triggers automatically on push to develop branch
- Production deployment requires manual trigger (manual job)
- Uses GitLab CI/CD variables for secrets
- Documents all required GitLab CI/CD variables
- Pipeline produces equivalent outcomes to the GitHub Actions workflows

### Requirement 9: CI/CD IAM User Setup

The guide MUST document how to create a dedicated IAM user for CI/CD pipelines with least-privilege permissions.

**User Story:** As an operator setting up CI/CD, I want to create a dedicated IAM user with minimal permissions so my pipeline is secure.

#### Acceptance Criteria

- Provides an IAM policy document with minimum required permissions for deployment
- Explains how to create the IAM user and generate access keys
- Documents key rotation best practices
- Warns against using root/admin credentials in CI/CD
- Applicable to both GitHub and GitLab pipelines

### Requirement 10: Deployment Verification

The guide MUST provide verification steps after each major deployment phase.

**User Story:** As an operator, I want verification commands after each phase so I can confirm everything works before moving on.

#### Acceptance Criteria

- Health check commands for dev and prod API endpoints
- JWT authentication test (render request with valid token)
- Forge app test in Confluence (add macro, verify rendering)
- CloudFormation stack status check commands
- Forge variables list verification

### Requirement 11: Troubleshooting Guide

The guide MUST include a troubleshooting section covering common deployment failures.

**User Story:** As an operator encountering an error, I want a troubleshooting section so I can quickly identify the cause and fix it.

#### Acceptance Criteria

- Covers: "Export already exists" CloudFormation error
- Covers: JWT verification failures (secret mismatch)
- Covers: Forge CLI login issues (token expiry)
- Covers: SAM deploy failures (permissions, bucket issues)
- Covers: Lambda timeout/memory issues
- Covers: API Gateway 403/401 errors
- Each issue includes: symptoms, cause, and resolution steps

### Requirement 12: AI Steering Skill File

A `.kiro/steering/deployment-guide.md` file MUST be created that enables Kiro AI to interactively guide operators through deployment.

**User Story:** As an operator using Kiro, I want to activate a deployment skill so the AI can guide me through the process interactively.

#### Acceptance Criteria

- File is located at `.kiro/steering/deployment-guide.md`
- Uses `inclusion: manual` frontmatter so it's activated on demand
- Contains structured instructions for Kiro to follow during guided deployment
- References the main deployment guide document for detailed steps

### Requirement 13: Interactive Environment Detection

The steering skill MUST guide Kiro to detect the operator's current environment state before proceeding.

**User Story:** As an operator, I want Kiro to automatically detect what already exists in my environment so it adapts the guidance accordingly.

#### Acceptance Criteria

- Instructs Kiro to check: AWS credentials validity, existing CloudFormation stacks, existing SSM parameters, Forge CLI login status
- Adapts guidance based on detected state (fresh install vs recovery vs update)
- Asks operator for environment-specific values (region, profile, CI platform)
- Stores collected values for use in subsequent commands

### Requirement 14: Phase-by-Phase Guidance

The steering skill MUST structure the deployment into distinct phases with validation between each.

**User Story:** As an operator being guided by Kiro, I want the deployment broken into validated phases so I don't proceed with errors.

#### Acceptance Criteria

- Defines phases: Prerequisites → Secrets → Infrastructure → Forge → CI/CD → Verification
- Each phase has entry conditions (what must be true before starting)
- Each phase has exit conditions (what must be verified before proceeding)
- Provides error handling guidance for each phase
- Allows resuming from any phase if deployment is interrupted

### Requirement 15: Adaptive Command Generation

The steering skill MUST instruct Kiro to generate commands adapted to the operator's specific environment.

**User Story:** As an operator, I want Kiro to generate commands with my specific AWS profile, region, and naming conventions already filled in.

#### Acceptance Criteria

- Commands use operator's AWS profile, region, and stack names
- Commands adapt to the detected deployment scenario (fresh/recovery/update)
- Provides both execute and verify commands for each step
- Handles platform-specific differences (macOS vs Linux, GitHub vs GitLab)

### Requirement 16: Document Organization

The deployment guide MUST be well-organized with clear navigation and logical structure.

**User Story:** As an operator reading the guide, I want clear navigation so I can quickly find the section relevant to my current step.

#### Acceptance Criteria

- Located at `docs/ONPREMISE_DEPLOYMENT.md`
- Table of contents with links to all sections
- Sections follow deployment order: Prerequisites → AWS Setup → Forge Setup → CI/CD → Verification → Troubleshooting
- Cross-references to existing project docs where relevant
- Maximum 3 levels of heading nesting for readability

### Requirement 17: Self-Contained Completeness

The guide MUST be self-contained enough that an operator with only the source code and an AWS account can deploy without external knowledge.

**User Story:** As a new operator with no prior project context, I want the guide to be self-contained so I can deploy without asking the original author.

#### Acceptance Criteria

- Does not assume prior knowledge of the project's architecture (includes brief overview)
- Provides links to external resources for tool installation
- Includes estimated time for each phase
- Includes estimated AWS costs
- References existing project files by relative path where needed
