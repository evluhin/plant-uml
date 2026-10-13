# Implementation Plan: On-Premise Deployment Guide

## Overview

This plan implements the universal on-premise deployment guide and interactive AI steering skill for the PlantUML Confluence Cloud system. Tasks are ordered by dependency: the main guide document is created first, then GitLab CI/CD example, then the steering skill (which references the guide), and finally documentation updates.

## Tasks

- [x] 1. Create the universal deployment guide document at `docs/ONPREMISE_DEPLOYMENT.md` with: table of contents, architecture overview, parametric variables reference table (AWS_REGION, AWS_PROFILE, STACK_NAME_DEV/PROD, JWT_SECRET_PARAM_DEV/PROD, FORGE_APP_ID, FORGE_EMAIL), prerequisites section with tool version checks and IAM policy JSON, Phase 1 AWS Account Setup (IAM user/role creation, credential configuration, SSM JWT secret creation), Phase 2 Infrastructure Deployment (SAM build/deploy for dev and prod, retrieving API Gateway URLs, health checks), Phase 3 Forge App Setup (registration, API token, manifest.yml URL update, forge variables set, forge deploy, forge install), Phase 4 CI/CD Setup with GitHub Actions and GitLab CI/CD subsections listing all required secrets/variables, Verification section (health checks, JWT auth test, Confluence macro test), Recovery and Troubleshooting section (failed stacks, credential expiry, secret mismatch, common errors with symptoms/cause/resolution). Mark all manual steps with 🔧 MANUAL label with rationale. Include estimated time and cost per phase. (Requirements: 1, 2, 3, 4, 5, 6, 7, 10, 11, 16, 17)
- [x] 2. Create GitLab CI/CD example pipeline at `docs/gitlab-ci-example.yml` with stages lint, test, build, deploy-dev (triggered on develop push), deploy-prod (manual trigger), deploy-forge-dev, deploy-forge-prod, smoke-test. Include security scan job equivalent to the GitHub Actions security workflow. Document all required GitLab CI/CD variables in comments. Create CI/CD IAM policy JSON at `docs/iam-cicd-policy.json` with minimum required permissions. (Requirements: 8, 9)
- [x] 3. Create the interactive AI steering skill at `.kiro/steering/deployment-guide.md` with `inclusion: manual` frontmatter, structured instructions for environment detection (check AWS credentials, existing stacks, SSM params, Forge login), three deployment flows (fresh install, recovery, update), phase-by-phase guidance with entry/exit conditions and validation commands, adaptive command templates using collected operator variables, error handling guidance per phase, and reference to the deployment guide document. (Requirements: 12, 13, 14, 15)
- [x] 4. Update existing documentation: add `docs/ONPREMISE_DEPLOYMENT.md` to README.md documentation table, add note to SETUP.md top directing new operators to the on-premise guide, replace hardcoded URLs in `.env.example` with generic placeholders, verify all cross-references between documents are valid. (Requirements: 16, 17)

## Notes

- Task 1 is the largest deliverable (~500-700 lines) and forms the foundation for the steering skill
- Task 2 is mostly independent from Task 1 but should use the same variable names
- Task 3 depends on Task 1 being complete since it references the guide document
- Task 4 depends on Tasks 1-3 being complete for cross-reference validation
- The GitLab CI/CD pipeline (Task 2) is provided as an example file at `docs/`, not committed to the repo root

## Task Dependency Graph

```json
{
  "waves": [
    {
      "name": "Wave 1 - Core Documentation",
      "tasks": [1, 2]
    },
    {
      "name": "Wave 2 - AI Steering Skill",
      "tasks": [3]
    },
    {
      "name": "Wave 3 - Documentation Updates",
      "tasks": [4]
    }
  ]
}
```
