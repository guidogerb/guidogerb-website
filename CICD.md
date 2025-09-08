# Multi-Tenant CI/CD Guide

This repository supports automated deployment of multiple websites through GitHub Actions workflows integrated with CloudFormation infrastructure.

## Supported Websites

- **garygerber.com** - Personal website
- **picklecheeze.com** - Blog/portfolio site  
- **this-is-my-story.org** - Story sharing platform
- **stream4cloud.com** - Streaming service platform
- **guidogerbpublishing.com** - GuidoGerb Publishing, LLC website and platform

## Workflow Overview

### 1. Build and Test (CI) - `.github/workflows/build.yml`

**Triggered on:** Pull requests to `main` or `prod` branches

**What it does:**
- Builds all shared components 
- Tests building each website in branch-appropriate mode (staging/production)
- Runs linting across all packages
- Uploads build artifacts for verification

### 2. Multi-Tenant Deploy - `.github/workflows/deploy.yml`

**Triggered on:** 
- Push to `main` or `prod` branches (automatic)
- Manual workflow dispatch (selective deployment)

**What it does:**
- Builds all websites in appropriate mode based on branch
- Deploys each site to its CloudFormation-managed infrastructure  
- Syncs built assets to S3 buckets
- Invalidates CloudFront distributions

**Manual Deployment Options:**
- Deploy specific sites: `garygerber.com,picklecheeze.com` 
- Override environment: `staging` or `production`

### 3. Infrastructure Management - `.github/workflows/deploy-infrastructure.yml`

**Triggered on:** Manual workflow dispatch only

**What it does:**
- Deploys/updates CloudFormation stacks for website infrastructure
- Manages S3 buckets, CloudFront distributions, SSL certificates
- Can deploy individual domains or all at once

## Branch Strategy

- **main** branch → Staging environment
- **prod** branch → Production environment

Each environment uses different:
- S3 bucket names
- CloudFront distribution configurations
- Build optimization settings

## Required Secrets

Configure these in your GitHub repository settings:

### AWS Integration
- `AWS_ROLE_ARN` - IAM role for GitHub Actions OIDC
- `AWS_REGION` - AWS region (default: us-east-1)

### Package Registry
- `NPMRC_TOKEN` - GitHub Packages access token for @guidogerb scope

### Site Configuration  
- `VITE_ENV` - Environment variables for Vite builds (optional)

## CloudFormation Integration

The workflows automatically discover deployment targets by:

1. Querying CloudFormation stacks named `s4c-edge-{domain-with-hyphens}`
2. Extracting `SiteBucketName` and `DistributionId` outputs
3. Using these for S3 sync and CloudFront invalidation

**Example stack names:**
- `garygerber.com` → `s4c-edge-garygerber-com`
- `this-is-my-story.org` → `s4c-edge-this-is-my-story-org`

## Manual Deployment

### Deploy All Sites
```bash
# Trigger via GitHub UI or:
gh workflow run deploy.yml
```

### Deploy Specific Sites
```bash
gh workflow run deploy.yml \
  -f sites="garygerber.com,stream4cloud.com" \
  -f environment="staging"
```

### Deploy Infrastructure
```bash
# Deploy all domain infrastructure
gh workflow run deploy-infrastructure.yml -f action="deploy-all"

# Deploy single domain
gh workflow run deploy-infrastructure.yml \
  -f action="deploy" \
  -f domain="garygerber.com"
```

## Local Development

### Build All Sites
```bash
npm run build
```

### Build Specific Site
```bash
npm run build:site:garygerber
npm run build:site:picklecheeze  
npm run build:site:this-is-my-story
npm run build:site:stream4cloud
```

### Development Server
```bash
npm run dev:site:garygerber
# etc.
```

## Troubleshooting

### Site Not Deploying
1. Check CloudFormation stack exists and is healthy
2. Verify stack outputs contain `SiteBucketName` and `DistributionId`
3. Check AWS credentials and permissions
4. Review workflow logs for specific errors

### Build Failures
1. Ensure all workspace dependencies are properly linked
2. Check for environment-specific configuration issues
3. Verify Node.js version compatibility

### Infrastructure Issues
1. Use the infrastructure deployment workflow to recreate stacks
2. Check CloudFormation events in AWS console
3. Verify parameter files in `infra/cfn/params/`

## Architecture Notes

- **Monorepo Structure**: Shared components under `@guidogerb/`, websites under `websites/`
- **Package Management**: Uses pnpm workspaces for efficient dependency management
- **Build Optimization**: Different build modes for staging vs production
- **Cache Strategy**: CloudFront caching with 5-minute default TTL
- **Security**: OIDC-based AWS authentication, no long-lived credentials