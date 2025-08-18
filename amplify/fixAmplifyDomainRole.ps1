param(
  [string]$RoleName = "AWSAmplifyDomainRole",
  [string]$Region = "us-east-1",
  [string]$HostedZoneId = "",
  [switch]$Force
)

<#!
.SYNOPSIS
  Recreate the missing IAM role used by AWS Amplify Hosting Domain Management (e.g., "AWSAmplifyDomainRole-<id>")
  when the console shows: "The role with name AWSAmplifyDomainRole-... cannot be found."

.DESCRIPTION
  Amplify creates a per-domain IAM role to manage DNS/validation. If that role is deleted or not created properly,
  Amplify Console will block domain association with the error above. This script creates an IAM role with the proper
  trust policy (amplify.amazonaws.com) and attaches a minimal inline policy to allow Route53 record reads, and optionally
  Route53 record changes when a Hosted Zone is provided.

  Notes:
  - If your registrar/DNS is external (not Route 53), Amplify may not need Route 53 permissions. You can still run
    this script safely; permissions apply only within your AWS account.
  - If your account uses a specific hashed/unique role name shown in the error (e.g., AWSAmplifyDomainRole-Z0960...),
    pass it with -RoleName "AWSAmplifyDomainRole-Z0960..." to match exactly.
  - If you know your Hosted Zone ID, set -HostedZoneId to scope down permissions; otherwise, the policy will omit
    change permissions to avoid invalid Resource settings for ChangeResourceRecordSets.

.EXAMPLES
  # Generic role name (let Amplify find and reuse it)
  ./fixAmplifyDomainRole.ps1 -RoleName AWSAmplifyDomainRole -Region us-east-1

  # Exact role as shown in the error
  ./fixAmplifyDomainRole.ps1 -RoleName AWSAmplifyDomainRole-Z09604182LJLD0XSED80O -Region us-east-1

  # Scope to a specific Hosted Zone (enables ChangeResourceRecordSets)
  ./fixAmplifyDomainRole.ps1 -RoleName AWSAmplifyDomainRole -HostedZoneId Z123EXAMPLE -Region us-east-1
!#>

$ErrorActionPreference = 'Stop'

Write-Host "Ensuring IAM role '$RoleName' exists for Amplify Domain Management (region: $Region)" -ForegroundColor Cyan

function Write-NoBomUtf8 {
  param(
    [Parameter(Mandatory=$true)][string]$Path,
    [Parameter(Mandatory=$true)][string]$Content
  )
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

# Build trust policy: allow Amplify service to assume this role
$trustPolicy = @{
  Version = '2012-10-17'
  Statement = @(
    @{ Effect = 'Allow'; Principal = @{ Service = 'amplify.amazonaws.com' }; Action = 'sts:AssumeRole' }
  )
} | ConvertTo-Json -Depth 5

# Build inline policy for Route53 reads and ACM reads (and optional changes when HostedZoneId supplied)
$statements = @()
$statements += @{ Effect = 'Allow'; Action = @('route53:ListHostedZones', 'route53:ListHostedZonesByName', 'route53:ListResourceRecordSets', 'route53:GetChange'); Resource = '*' }
$statements += @{ Effect = 'Allow'; Action = @('acm:ListCertificates', 'acm:DescribeCertificate'); Resource = '*' }
if ($HostedZoneId) {
  $hostedZoneArn = "arn:aws:route53:::hostedzone/$HostedZoneId"
  $statements += @{ Effect = 'Allow'; Action = @('route53:ChangeResourceRecordSets'); Resource = $hostedZoneArn }
}
$policyDoc = @{ Version = '2012-10-17'; Statement = $statements } | ConvertTo-Json -Depth 5

function Ensure-RoleExists {
  param([string]$Name)
  try {
    $exists = aws iam get-role --role-name $Name | ConvertFrom-Json
    if ($exists.Role.Arn) {
      Write-Host "Role already exists: $($exists.Role.Arn)" -ForegroundColor Green
      return $true
    }
  } catch {
    Write-Host "Role not found. Will create: $Name" -ForegroundColor Yellow
  }
  return $false
}

$exists = Ensure-RoleExists -Name $RoleName
if (-not $exists) {
  Write-Host "Creating IAM role '$RoleName'..." -ForegroundColor Cyan
  # Write trust policy to a temp file to avoid JSON escaping issues and BOMs
  $trustFile = [System.IO.Path]::GetTempFileName()
  Write-NoBomUtf8 -Path $trustFile -Content $trustPolicy
  try {
    aws iam create-role --role-name $RoleName --assume-role-policy-document file://$trustFile | Out-Null
  } catch {
    Write-Host "CreateRole failed. Trust policy file: $trustFile" -ForegroundColor Red
    throw
  } finally {
    Remove-Item -Path $trustFile -ErrorAction SilentlyContinue
  }
}

# Put/overwrite inline policy
$policyName = 'AmplifyDomainManagementPolicy'
Write-Host "Attaching inline policy '$policyName' (Route 53 + ACM minimal)" -ForegroundColor Cyan
# Write policy doc to a temp file to avoid JSON escaping issues and BOMs
$policyFile = [System.IO.Path]::GetTempFileName()
Write-NoBomUtf8 -Path $policyFile -Content $policyDoc
try {
  aws iam put-role-policy --role-name $RoleName --policy-name $policyName --policy-document file://$policyFile | Out-Null
} catch {
  Write-Host "PutRolePolicy failed. Policy file: $policyFile" -ForegroundColor Red
  throw
} finally {
  Remove-Item -Path $policyFile -ErrorAction SilentlyContinue
}

# Final readback and guidance
$role = $null
try { $role = aws iam get-role --role-name $RoleName | ConvertFrom-Json } catch {}
if ($role -and $role.Role -and $role.Role.Arn) {
  Write-Host "Role ready: $($role.Role.Arn)" -ForegroundColor Green
} else {
  Write-Host "Role not confirmed via get-role. Please verify in IAM Console. RoleName: $RoleName" -ForegroundColor Yellow
}
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1) Return to Amplify Console → Hosting → Domain management and retry the failed action." -ForegroundColor Yellow
Write-Host "  2) If you still see the error, use the exact role name from the error with -RoleName and rerun this script." -ForegroundColor Yellow
Write-Host "  3) If your DNS is external, you can also bypass Route 53 by creating the DNS records manually (see setupCustomDomain.ps1 output)." -ForegroundColor Yellow
