# S3 Deployment Roles and Permissions Guide

This document describes all the IAM roles and permissions necessary for the S3 deployment pipeline to work in the guidogerb-website repository.

## Quick Reference

**Primary Role**: `GitHubActionsDeployRole` (OIDC role for GitHub Actions)

**Required Secrets in GitHub**:

- `AWS_ACCOUNT_ID` - Your AWS account ID
- `AWS_DEPLOY_ROLE` - Role name (e.g., `GitHubActionsDeployRole`)
- `AWS_REGION` - AWS region (default: `us-east-1`)

**Key Permissions Needed**:

- S3: Read/write access to website buckets
- CloudFront: Create invalidations
- CloudFormation: Manage infrastructure stacks
- Route53: Manage DNS records (optional)

## Overview

The deployment system uses GitHub Actions with OIDC (OpenID Connect) to securely deploy websites to AWS S3 buckets with CloudFront distributions. The system supports multiple websites and uses CloudFormation for infrastructure management.

## Required IAM Roles

### 1. GitHub Actions OIDC Role

**Role Name**: `GitHubActionsDeployRole` (referenced as `${{ secrets.AWS_DEPLOY_ROLE }}` in workflows)

**Purpose**: This is the primary role that GitHub Actions assumes to perform deployments.

**Trust Policy**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT-ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:guidogerb/guidogerb-website:*"
        }
      }
    }
  ]
}
```

**Required Permissions**:

#### S3 Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::websites",
        "arn:aws:s3:::websites/*",
        "arn:aws:s3:::*-garygerber-com",
        "arn:aws:s3:::*-garygerber-com/*",
        "arn:aws:s3:::*-stream4cloud-com",
        "arn:aws:s3:::*-stream4cloud-com/*",
        "arn:aws:s3:::*-picklecheeze-com",
        "arn:aws:s3:::*-picklecheeze-com/*",
        "arn:aws:s3:::*-this-is-my-story-org",
        "arn:aws:s3:::*-this-is-my-story-org/*",
        "arn:aws:s3:::*-guidogerbpublishing-com",
        "arn:aws:s3:::*-guidogerbpublishing-com/*"
      ]
    }
  ]
}
```

#### CloudFront Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetDistribution",
        "cloudfront:ListDistributions"
      ],
      "Resource": "*"
    }
  ]
}
```

#### CloudFormation Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:CreateStack",
        "cloudformation:UpdateStack",
        "cloudformation:DeleteStack",
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeStackResources",
        "cloudformation:DescribeStackEvents",
        "cloudformation:GetTemplate",
        "cloudformation:ListStacks",
        "cloudformation:ListStackResources"
      ],
      "Resource": [
        "arn:aws:cloudformation:*:*:stack/s4c-edge-*",
        "arn:aws:cloudformation:*:*:stack/s4c-auth*",
        "arn:aws:cloudformation:*:*:stack/s4c-api*",
        "arn:aws:cloudformation:*:*:stack/s4c-data*",
        "arn:aws:cloudformation:*:*:stack/s4c-media*",
        "arn:aws:cloudformation:*:*:stack/s4c-oss*"
      ]
    }
  ]
}
```

**Note**: The deployment workflow queries CloudFormation stacks to get outputs like `SiteBucketName` and `DistributionId`, which are used for S3 sync and CloudFront invalidation operations.

#### Route53 Permissions (Optional)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "route53:ChangeResourceRecordSets",
        "route53:GetHostedZone",
        "route53:ListResourceRecordSets"
      ],
      "Resource": "arn:aws:route53:::hostedzone/*"
    }
  ]
}
```

#### Additional CloudFormation Service Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:UpdateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:PassRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:CreatePolicy",
        "iam:DeletePolicy",
        "iam:GetPolicy",
        "iam:ListPolicyVersions",
        "acm:DescribeCertificate",
        "acm:ListCertificates"
      ],
      "Resource": "*"
    }
  ]
}
```

## Complete IAM Policy Example

Here's a comprehensive IAM policy that includes all the required permissions for the GitHub Actions OIDC role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3DeploymentPermissions",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::websites",
        "arn:aws:s3:::websites/*",
        "arn:aws:s3:::*-garygerber-com",
        "arn:aws:s3:::*-garygerber-com/*",
        "arn:aws:s3:::*-stream4cloud-com",
        "arn:aws:s3:::*-stream4cloud-com/*",
        "arn:aws:s3:::*-picklecheeze-com",
        "arn:aws:s3:::*-picklecheeze-com/*",
        "arn:aws:s3:::*-this-is-my-story-org",
        "arn:aws:s3:::*-this-is-my-story-org/*",
        "arn:aws:s3:::*-guidogerbpublishing-com",
        "arn:aws:s3:::*-guidogerbpublishing-com/*"
      ]
    },
    {
      "Sid": "CloudFrontPermissions",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetDistribution",
        "cloudfront:ListDistributions"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudFormationPermissions",
      "Effect": "Allow",
      "Action": [
        "cloudformation:CreateStack",
        "cloudformation:UpdateStack",
        "cloudformation:DeleteStack",
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeStackResources",
        "cloudformation:DescribeStackEvents",
        "cloudformation:GetTemplate",
        "cloudformation:ListStacks",
        "cloudformation:ListStackResources"
      ],
      "Resource": [
        "arn:aws:cloudformation:*:*:stack/s4c-edge-*",
        "arn:aws:cloudformation:*:*:stack/s4c-auth*",
        "arn:aws:cloudformation:*:*:stack/s4c-api*",
        "arn:aws:cloudformation:*:*:stack/s4c-data*",
        "arn:aws:cloudformation:*:*:stack/s4c-media*",
        "arn:aws:cloudformation:*:*:stack/s4c-oss*"
      ]
    },
    {
      "Sid": "Route53Permissions",
      "Effect": "Allow",
      "Action": [
        "route53:ChangeResourceRecordSets",
        "route53:GetHostedZone",
        "route53:ListResourceRecordSets"
      ],
      "Resource": "arn:aws:route53:::hostedzone/*"
    },
    {
      "Sid": "CloudFormationServicePermissions",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:UpdateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:PassRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:CreatePolicy",
        "iam:DeletePolicy",
        "iam:GetPolicy",
        "iam:ListPolicyVersions",
        "acm:DescribeCertificate",
        "acm:ListCertificates"
      ],
      "Resource": "*"
    }
  ]
}
```

### 2. CloudFormation Service Role (Optional)

If you want to use a dedicated CloudFormation service role instead of having the GitHub Actions role perform all CloudFormation operations directly:

**Role Name**: `CloudFormationServiceRole`

**Trust Policy**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudformation.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

**Permissions**: Same as the CloudFormation and additional service permissions listed above for the GitHub Actions role.

## Setup Instructions

### 1. Create OIDC Provider

First, create an OIDC identity provider in your AWS account:

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
  --client-id-list sts.amazonaws.com
```

### 2. Create the GitHub Actions Role

```bash
# Create the role with trust policy
aws iam create-role \
  --role-name GitHubActionsDeployRole \
  --assume-role-policy-document file://trust-policy.json

# Attach the required policies (create custom policies first)
aws iam attach-role-policy \
  --role-name GitHubActionsDeployRole \
  --policy-arn arn:aws:iam::ACCOUNT-ID:policy/S3DeploymentPolicy

aws iam attach-role-policy \
  --role-name GitHubActionsDeployRole \
  --policy-arn arn:aws:iam::ACCOUNT-ID:policy/CloudFrontDeploymentPolicy

aws iam attach-role-policy \
  --role-name GitHubActionsDeployRole \
  --policy-arn arn:aws:iam::ACCOUNT-ID:policy/CloudFormationDeploymentPolicy
```

### 3. Configure GitHub Secrets

Set these secrets in your GitHub repository:

- `AWS_ACCOUNT_ID`: Your AWS account ID
- `AWS_DEPLOY_ROLE`: `GitHubActionsDeployRole`
- `AWS_REGION`: `us-east-1` (or your preferred region)

### 4. Configure GitHub Variables (Optional)

Set these variables for default values:

- `SITE`: Default site to deploy (e.g., `guidogerbpublishing.com`)
- `BUCKET`: Default S3 bucket name
- `DISTRIBUTION_ID`: Default CloudFront distribution ID

## Security Considerations

1. **Least Privilege**: The role permissions are scoped to specific resources and actions needed for deployment.

2. **Repository Restriction**: The OIDC trust policy restricts access to the specific GitHub repository.

3. **Branch Protection**: Consider adding branch conditions to the trust policy to restrict deployments to specific branches:

```json
"StringEquals": {
  "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
  "token.actions.githubusercontent.com:sub": "repo:guidogerb/guidogerb-website:ref:refs/heads/main"
}
```

4. **Resource Naming**: S3 buckets and CloudFormation stacks follow predictable naming patterns for security scoping.

## Stack Naming Convention

The system uses a predictable naming convention for CloudFormation stacks:

- **Edge sites**: `s4c-edge-{domain-with-hyphens}`
  - Example: `garygerber.com` → `s4c-edge-garygerber-com`
  - Example: `this-is-my-story.org` → `s4c-edge-this-is-my-story-org`
- **Other stacks**: `s4c-{service}` (auth, api, data, media, etc.)

## Supported Domains

The deployment system currently supports these domains:

- `garygerber.com`
- `stream4cloud.com`
- `picklecheeze.com`
- `this-is-my-story.org`
- `guidogerbpublishing.com`

## Workflow Integration

The GitHub Actions workflows automatically use these roles:

### Deploy Workflow (`.github/workflows/deploy.yml`)

- Uses OIDC to assume the GitHub Actions role
- Builds the specified website using pnpm
- Syncs built websites to S3 buckets using `aws s3 sync`
- Invalidates CloudFront distributions for cache refresh
- Supports both automatic deployment (on successful builds) and manual deployment

### Infrastructure Deployment (`.github/workflows/deploy-infrastructure.yml`)

- Uses OIDC to assume the GitHub Actions role
- Manages CloudFormation stacks for website infrastructure using the Makefile in `infra/cfn/`
- Creates S3 buckets, CloudFront distributions, and Route53 records
- Can deploy individual domains or all domains at once

**Note**: The infrastructure deployment workflow expects CloudFormation templates to be in the `infra/cfn/` directory, but the actual templates are currently in `infra/cfn/stream4cloud/`. This may require copying templates or updating the Makefile paths.

## Troubleshooting

### Common Issues

1. **OIDC Trust Relationship**: Ensure the OIDC provider thumbprint is correct and the trust policy matches your repository.

2. **S3 Permissions**: Verify that bucket names in the policy match the actual buckets created by CloudFormation.

3. **CloudFront Permissions**: The role needs `cloudfront:CreateInvalidation` permissions for cache invalidation.

4. **CloudFormation Stack Names**: Ensure the CloudFormation policy resources match the actual stack naming pattern (`s4c-edge-*`).

### Debugging Steps

1. Check GitHub Actions logs for specific permission errors
2. Verify role trust relationships in AWS IAM console
3. Test role assumptions manually using AWS CLI
4. Review CloudFormation stack events for deployment issues

## Related Documentation

- [CICD.md](./CICD.md) - Overall CI/CD workflow guide
- [infra/cfn/DEPLOY_GUIDE.md](./infra/cfn/DEPLOY_GUIDE.md) - CloudFormation deployment guide
- [GitHub Actions OIDC Documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)

## Summary

For S3 deployment to work, you need:

1. **One primary IAM role**: `GitHubActionsDeployRole` with OIDC trust policy
2. **Five main permission areas**: S3, CloudFront, CloudFormation, Route53, and IAM
3. **Three GitHub secrets**: `AWS_ACCOUNT_ID`, `AWS_DEPLOY_ROLE`, `AWS_REGION`
4. **Proper CloudFormation stacks**: Following the `s4c-edge-{domain}` naming convention

The role must be able to:

- Upload files to S3 buckets (for website content)
- Invalidate CloudFront distributions (for cache updates)
- Query and manage CloudFormation stacks (for infrastructure)
- Create DNS records in Route53 (for custom domains)

This setup enables secure, automated deployment of multiple websites from a single GitHub repository to AWS S3 with CloudFront CDN.
