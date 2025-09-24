<#
.SYNOPSIS
  Validates input for upcoming CloudFront tenant provisioning automation.

.DESCRIPTION
  `AddCF-Tenant.ps1` now captures the contract that future automation will
  honour. The script requires the caller to provide the tenant domain, a human
  friendly display name, the shared CloudFront distribution identifier, and the
  list of environment secret keys that must be provisioned. Guard rails ensure
  callers cannot attempt to create duplicate tenants or provide malformed
  inputs. The orchestration that scaffolds a new workspace and wires it into the
  repository will plug into the validated parameters in a later task.

.PARAMETER Domain
  Fully qualified domain name for the tenant. Only lower-case alphanumeric
  characters and hyphens are allowed, and the domain must not already exist in
  `cf-distributions.json` or the `websites/` directory.

.PARAMETER DisplayName
  Human readable label that operators see in dashboards, secrets management
  systems, and release tooling. Leading/trailing whitespace is stripped and the
  final value must be between 3 and 80 characters.

.PARAMETER DistributionId
  CloudFront distribution identifier that the tenant belongs to. Guard rails
  ensure the identifier is the expected 13 character upper-case alpha numeric
  value.

.PARAMETER EnvSecretKeys
  List of environment secret names that must be created alongside the tenant.
  Keys must be unique (case-insensitive) and adhere to the `^[A-Z0-9_]+$`
  pattern so GitHub Actions, local `.env` files, and deployment tooling can rely
  on consistent naming.

.NOTES
  Implementation is tracked in infra/ps1/tasks.md. Provisioning steps are still
  pending; this script currently enforces the input contract and guard rails so
  that subsequent automation can rely on validated inputs.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$')]
    [ValidateLength(4, 253)]
    [string]
    $Domain,

    [Parameter(Mandatory = $true)]
    [ValidateLength(3, 80)]
    [string]
    $DisplayName,

    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[A-Z0-9]{13}$')]
    [string]
    $DistributionId,

    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string[]]
    $EnvSecretKeys
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$cfDistributionsPath = Join-Path $PSScriptRoot 'cf-distributions.json'

if (-not (Test-Path -Path $cfDistributionsPath -PathType Leaf)) {
    throw "Unable to locate '$cfDistributionsPath'. The tenant contract requires the distribution registry."
}

$cfDistributions = Get-Content -Path $cfDistributionsPath -Raw | ConvertFrom-Json -AsHashtable
$normalizedDomain = $Domain.ToLowerInvariant()
$existingDomainMapping = $cfDistributions.Keys |
    Where-Object { ($_.ToString()).ToLowerInvariant() -eq $normalizedDomain } |
    Select-Object -First 1

if ($existingDomainMapping) {
    throw "The domain '$Domain' is already mapped to CloudFront distribution '$($cfDistributions[$existingDomainMapping])'."
}

$websitesRoot = Join-Path $repoRoot 'websites'
$tenantWorkspacePath = Join-Path $websitesRoot $Domain

if (-not (Test-Path -Path $websitesRoot -PathType Container)) {
    throw "Unable to locate websites root at '$websitesRoot'. Ensure the repository layout matches expectations."
}

if (Test-Path -Path $tenantWorkspacePath) {
    throw "A workspace at '$tenantWorkspacePath' already exists. Choose a new domain or remove the conflicting workspace before retrying."
}

$normalizedDisplayName = $DisplayName.Trim()
if ($normalizedDisplayName.Length -lt 3 -or $normalizedDisplayName.Length -gt 80) {
    throw "DisplayName must be between 3 and 80 characters after trimming whitespace."
}

if ($normalizedDisplayName -ne $DisplayName) {
    Write-Verbose "DisplayName contained leading/trailing whitespace. Using trimmed value '$normalizedDisplayName'."
}

$invalidSecretKeys = @()
$duplicateSecretKeys = @()

if ($EnvSecretKeys.Count -lt 1) {
    throw 'At least one environment secret key must be supplied.'
}

$trimmedSecretKeys = $EnvSecretKeys | ForEach-Object {
    $candidate = $_.Trim()
    if (-not $candidate) {
        $invalidSecretKeys += '<<empty>>'
    }
    elseif ($candidate -notmatch '^[A-Z0-9_]+$') {
        $invalidSecretKeys += $candidate
    }
    $candidate
}

if ($invalidSecretKeys.Count -gt 0) {
    throw "Environment secret keys must match ^[A-Z0-9_]+$ and cannot be empty. Invalid values: $($invalidSecretKeys -join ', ')."
}

$duplicateSecretKeys = $trimmedSecretKeys |
    Group-Object -Property { $_.ToLowerInvariant() } |
    Where-Object { $_.Count -gt 1 } |
    ForEach-Object { $_.Group | Select-Object -First 1 }

if ($duplicateSecretKeys.Count -gt 0) {
    throw "Environment secret keys must be unique (case-insensitive). Duplicates detected: $($duplicateSecretKeys -join ', ')."
}

$normalizedSecretKeys = [string[]]$trimmedSecretKeys

$result = [PSCustomObject]@{
    Domain         = $Domain
    DisplayName    = $normalizedDisplayName
    DistributionId = $DistributionId
    EnvSecretKeys  = $normalizedSecretKeys
}

Write-Verbose ('Validated tenant contract: {0}' -f ($result | ConvertTo-Json -Compress))
Write-Output $result
