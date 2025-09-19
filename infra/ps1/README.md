```aiignore
aws cloudfront create-invalidation-for-distribution-tenant --id [DistributionTenantId] --invalidation-batch file://invalidation.json

aws cloudfront list-distribution-tenants --association-filter ConnectionGroupId=cg_32sfxmSASFzUylWCyWaN5vOLKgv --query "DistributionTenantList[].Id" --output text

aws cloudfront list-distribution-tenants --association-filter ConnectionGroupId=cg_32sfxmSASFzUylWCyWaN5vOLKgv --max-items 100

```
