# Terraform Infrastructure as Code

This directory contains the Terraform configuration for the Digital Asset Platform infrastructure. The code is organized using a modular approach with environment-specific configurations.

## Structure

```
terraform/
├── environments/           # Environment-specific configurations
│   ├── dev/                # Development environment
│   └── prod/               # Production environment
├── modules/                # Reusable infrastructure components
│   ├── networking/         # VPC, subnets, security groups, etc.
│   ├── storage/            # S3 buckets, EFS, etc.
│   ├── compute/            # ECS, Lambda, EC2, etc.
│   ├── database/           # RDS, DynamoDB, etc.
│   ├── security/           # IAM roles, policies, KMS, etc.
│   ├── content-delivery/   # CloudFront distributions
│   ├── streaming/          # Streaming infrastructure
│   └── identity/           # ForgeRock AM and authentication
└── scripts/                # Utility scripts for Terraform operations
```

## Prerequisites

- Terraform v1.0.0 or newer
- AWS CLI configured with appropriate credentials
- S3 bucket for Terraform state (defined in backend configuration)
- DynamoDB table for state locking

## Usage

### Initialize Terraform

```bash
cd terraform/environments/dev
terraform init
```

### Plan Changes

```bash
terraform plan -out=tfplan
```

### Apply Changes

```bash
terraform apply tfplan
```

### Destroy Infrastructure

```bash
terraform destroy
```

## Environments

- **dev**: Development environment for testing
- **prod**: Production environment

## CI/CD Integration

This Terraform configuration is designed to be used with the GitHub Actions workflows in the `.github/workflows` directory. The workflows include steps to validate, plan, and apply Terraform changes.

## State Management

Terraform state is stored in an S3 bucket with state locking using DynamoDB. This allows for team collaboration and prevents concurrent modifications to the infrastructure.

## Security Considerations

- All sensitive values are stored in AWS Systems Manager Parameter Store
- IAM roles follow the principle of least privilege
- All resources are deployed within a VPC with appropriate security groups
- All S3 buckets have encryption enabled
- CloudFront distributions use HTTPS only
