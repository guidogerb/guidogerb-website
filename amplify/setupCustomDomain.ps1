param(
  [Parameter(Mandatory=$true)][string]$AppId,
  [Parameter(Mandatory=$true)][string]$DomainName,
  [string]$Branch = "main",
  [string]$Region = "us-east-1",
  [switch]$NoWait
)

<#
.SYNOPSIS
  Associates a custom domain with an AWS Amplify Hosting app (Gen 1/Gen 2) and sets up standard subdomains.

.DESCRIPTION
  - Creates domain association for:
    * www.$DomainName -> $Branch
    * $DomainName (apex/root) -> redirect to www.$DomainName
  - If your domain is hosted in Route 53 in the same account, Amplify can automatically create DNS records.
  - If your domain is external, this command returns DNS target records to add at your registrar.

.EXAMPLE
  ./setupCustomDomain.ps1 -AppId d295eioxqacudl -DomainName guidogerbpublishing.com -Branch main -Region us-east-1

.REQUIREMENTS
  - AWS CLI v2 configured (aws configure) with permissions for amplify:CreateDomainAssociation, GetDomainAssociation, etc.
  - PowerShell 5+ (Windows) or PowerShell 7+ (cross-platform).
#>

$ErrorActionPreference = 'Stop'

Write-Host "Associating domain '$DomainName' with Amplify app '$AppId' (branch: $Branch, region: $Region)" -ForegroundColor Cyan

# Build the subDomain settings JSON
$subDomains = @(
  @{ subDomainSetting = @{ prefix = "www"; branchName = $Branch } },
  @{ subDomainSetting = @{ prefix = ""; branchName = $Branch }; enableAutoSubDomain = $false }
)

# Request: create or update domain association
$payload = @{ domainName = $DomainName; subDomainSettings = $subDomains } | ConvertTo-Json -Depth 5

try {
  $result = aws amplify create-domain-association `
    --app-id $AppId `
    --region $Region `
    --cli-input-json ($payload | ConvertTo-Json) | ConvertFrom-Json
} catch {
  # If already exists, update instead
  Write-Warning "create-domain-association failed, trying update-domain-association... ($_ )"
  $result = aws amplify update-domain-association `
    --app-id $AppId `
    --region $Region `
    --cli-input-json ($payload | ConvertTo-Json) | ConvertFrom-Json
}

$assoc = $result.domainAssociation

Write-Host "Status: $($assoc.domainStatus)" -ForegroundColor Green
Write-Host "Domain: $($assoc.domainName)" -ForegroundColor Green

if ($assoc.domainStatus -eq 'PENDING_VERIFICATION' -or $assoc.domainStatus -eq 'PENDING_DEPLOYMENT') {
  Write-Host "DNS verification pending. If your domain is NOT in Route 53 in this account, please create the following DNS records at your registrar:" -ForegroundColor Yellow
  foreach ($sub in $assoc.subDomains) {
    $dns = $sub.dnsRecord `
      | ForEach-Object { $_ }
    if ($dns) {
      Write-Host "- Subdomain: $($sub.subDomainSetting.prefix).$DomainName" -ForegroundColor Yellow
      Write-Host "  Type: $($dns.type)  Name: $($dns.name)  Value: $($dns.value)" -ForegroundColor Yellow
    }
  }
  Write-Host 'Note: DNS propagation can take 15-30 minutes (sometimes up to 24-48 hours).' -ForegroundColor Yellow
}

if (-not $NoWait) {
  Write-Host "Waiting for domain association to become AVAILABLE (Ctrl+C to stop)..." -ForegroundColor Cyan
  $max = 60
  for ($i=0; $i -lt $max; $i++) {
    Start-Sleep -Seconds 15
    $check = aws amplify get-domain-association --app-id $AppId --domain-name $DomainName --region $Region | ConvertFrom-Json
    $status = $check.domainAssociation.domainStatus
    Write-Host "  Attempt $($i+1): $status"
    if ($status -eq 'AVAILABLE') { break }
  }
}

Write-Host "Done. Verify in browser: https://www.$DomainName and https://$DomainName" -ForegroundColor Green
