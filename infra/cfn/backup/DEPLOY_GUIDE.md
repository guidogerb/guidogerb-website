# Stream4Cloud — Phase-1 Pure CloudFormation Deploy Guide

Prereqs: AWS CLI v2, Route 53 HostedZone, ACM certs in us-east-1.

## Steps

1. Edit params in `cfn/params/*` (CertificateArn, HostedZoneId, etc.).
2. Deploy edge sites, auth, api, data, media, search using PowerShell or Makefile.

### PowerShell (from cfn/)

.\deploy.ps1 -Action DeployEdgeAll -Region us-east-1
.\deploy.ps1 -Action DeployAuth -Region us-east-1
.\deploy.ps1 -Action GenerateApiParams -Region us-east-1
.\deploy.ps1 -Action DeployApi -Region us-east-1
.\deploy.ps1 -Action DeployData -Region us-east-1
.\deploy.ps1 -Action DeployMedia -Region us-east-1
.\deploy.ps1 -Action DeploySearch -Region us-east-1

### Makefile

make deploy-edge-all REGION=us-east-1
make deploy-auth REGION=us-east-1
make deploy-api REGION=us-east-1
make deploy-data REGION=us-east-1
make deploy-media REGION=us-east-1
make deploy-search REGION=us-east-1
