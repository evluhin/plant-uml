# Development Workflow & CI/CD Strategy

## 🏗️ **Recommended Workflow**

### **Local Development**
```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# 2. Make changes and test locally
./deploy.sh dev development  # Manual deployment for testing

# 3. Test with forge tunnel
cd apps/forge-plantuml
forge tunnel --environment development

# 4. Commit and push feature branch
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name
```

### **Integration & Deployment**
```bash
# 5. Create PR to develop (triggers CI only - no deployment)
# 6. After PR review, merge to develop (triggers dev deployment)
# 7. Test in development environment
# 8. When ready for production, create PR from develop to master
# 9. Merge to master (triggers production deployment)
```

## 🚀 **CI/CD Strategy Options**

### **Option A: Hybrid Approach (Recommended)**
- **Manual deployment** for active development/testing
- **Automated deployment** only for integration and production releases
- **CI checks** on all PRs

### **Option B: Full Automation**
- **All deployments** through GitHub Actions
- **No manual deployments** (except emergencies)
- **Feature branches** deploy to temporary environments

### **Option C: Manual Only**
- **Disable automated deployments**
- **Keep CI checks** for code quality
- **Manual deployment** for all environments

## 🔧 **Current Issues to Fix**

### 1. Missing GitHub Secrets
The workflows need these secrets/variables configured in GitHub:

**Repository Secrets:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY` 
- `FORGE_API_TOKEN`

**Repository Variables:**
- `AWS_REGION` (eu-north-1)
- `FORGE_EMAIL` (your email)
- `RENDERER_URL_DEV` (https://q2cro7gz51.execute-api.eu-north-1.amazonaws.com/dev)
- `RENDERER_URL_PROD` (https://gezrf8c2xa.execute-api.eu-north-1.amazonaws.com/prod)

### 2. Workflow Improvements Needed
- Use `forge` instead of `npx @forge/cli`
- Add proper error handling
- Skip deployment if no relevant changes
- Add deployment status notifications

### 3. Branch Strategy Clarification
- `develop` → development environment (auto-deploy)
- `master` → production environment (auto-deploy or manual approval)
- `feature/*` → CI checks only (no deployment)

## 📋 **Recommended Next Steps**

1. **Choose your preferred approach** (A, B, or C above)
2. **Configure GitHub secrets** if using automation
3. **Update workflows** based on chosen approach
4. **Test the workflow** with a small change
5. **Document the final process** for your team

## 🎯 **Quick Fix for Current Situation**

Since you've already deployed manually and CI/CD is failing:

### Option 1: Disable Auto-Deployment Temporarily
```yaml
# In .github/workflows/deploy-development.yml
on:
  workflow_dispatch: # Manual trigger only
  # push:
  #   branches: [develop]  # Comment out auto-trigger
```

### Option 2: Skip Deployment if Already Up-to-Date
Add a check to compare deployed version with current commit before deploying.

### Option 3: Configure Missing Secrets
Set up the required GitHub secrets and let automation work.

Which approach would you prefer?