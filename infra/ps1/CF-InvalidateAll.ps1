# powershell
<#
.SYNOPSIS
  Invalidate all tenants in a CloudFront multi-tenant connection group.

.DESCRIPTION
  - Gets tenant IDs via:
      aws cloudfront list-distribution-tenants --association-filter ConnectionGroupId=<id> --query "DistributionTenantList[].Id" --output text
  - For each tenant ID, runs:
      aws cloudfront create-invalidation-for-distribution-tenant --id <tenantId> --invalidation-batch file://<json>
  - If -InvalidationJson is not provided, builds batches from -Paths (max 30 items per batch) and generates CallerReference.

.PARAMETER ConnectionGroupId
  The ConnectionGroupId to query tenants for (e.g., cg_32sfxmSASFzUylWCyWaN5vOLKgv).

.PARAMETER InvalidationJson
  Optional path to a ready invalidation batch JSON file to reuse for all tenants.

.PARAMETER Paths
  Paths to invalidate relative to the tenant root. Default: '\/*'. Will be batched by 30.

.PARAMETER Profile
  Optional AWS CLI profile.

.PARAMETER DryRun
  Print the AWS commands without executing them.

.EXAMPLE
  .\CF-InvalidateAll.ps1 -ConnectionGroupId 'cg_32sfxmSASFzUylWCyWaN5vOLKgv' -Profile default

.EXAMPLE
  .\CF-InvalidateAll.ps1 -ConnectionGroupId 'cg_32sfxmSASFzUylWCyWaN5vOLKgv' -InvalidationJson 'invalidation.json'
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ConnectionGroupId,
    [string]$InvalidationJson,
    [string[]]$Paths = @('/*'),
    [string]$Profile,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Ensure-AwsCli {
    if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
        throw 'AWS CLI not found. Install AWS CLI v2 and ensure it is in PATH.'
    }
}

function Split-Batches {
    param([object[]]$Items, [int]$BatchSize = 30)
    if (-not $Items) { ,@(); return }
    if ($Items.Count -le $BatchSize) { ,@($Items); return }
    $batches = @()
    for ($i = 0; $i -lt $Items.Count; $i += $BatchSize) {
        $end = [Math]::Min($i + $BatchSize - 1, $Items.Count - 1)
        $batches += ,($Items[$i..$end])
    }
    return $batches
}

function Get-DistributionTenantIds {
    param([string]$ConnGroupId, [string]$Profile)
    $args = @(
        'cloudfront','list-distribution-tenants',
        '--association-filter', "ConnectionGroupId=$ConnGroupId",
        '--query', 'DistributionTenantList[].Id',
        '--output', 'text'
    )
    if ($Profile) { $args += @('--profile', $Profile) }

    $out = & aws @args | Out-String
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to list distribution tenants for ConnectionGroupId=$ConnGroupId"
    }
    $trim = $out.Trim()
    if ([string]::IsNullOrWhiteSpace($trim)) { return @() }
    return @($trim -split '\s+')
}

function New-InvalidationBatchFile {
    param([string[]]$Items, [string]$CallerReference)
    $obj = @{
        Paths = @{
            Quantity = $Items.Count
            Items    = $Items
        }
        CallerReference = $CallerReference
    }
    $json = $obj | ConvertTo-Json -Compress -Depth 5
    $path = Join-Path ([System.IO.Path]::GetTempPath()) ("cf-tenant-inv-{0}.json" -f ([Guid]::NewGuid().ToString('N')))
    Set-Content -LiteralPath $path -Value $json -Encoding UTF8 -NoNewline
    return $path
}

function Invoke-TenantInvalidations {
    param(
        [string[]]$TenantIds,
        [string]$Profile,
        [switch]$DryRun,
        [string]$InvalidationJson,
        [string[]]$Paths
    )

    $results = @()

    # Pre-resolve provided JSON once if given
    $providedJson = $null
    if ($InvalidationJson) {
        if (-not (Test-Path -LiteralPath $InvalidationJson)) {
            throw "Invalidation batch file not found: '$InvalidationJson'"
        }
        $providedJson = (Resolve-Path -LiteralPath $InvalidationJson).Path
    }

    $pathBatches = @()
    if (-not $providedJson) {
        # Ensure each path starts with '/'
        $normalized = @()
        foreach ($p in $Paths) {
            if ([string]::IsNullOrWhiteSpace($p)) { continue }
            $pp = $p
            if (-not $pp.StartsWith('/')) { $pp = '/' + $pp }
            $normalized += $pp
        }
        if (-not $normalized -or $normalized.Count -eq 0) {
            $normalized = @('/*')
        }
        $pathBatches = Split-Batches -Items $normalized -BatchSize 30
    }

    foreach ($tid in $TenantIds) {
        if ([string]::IsNullOrWhiteSpace($tid)) { continue }

        if ($providedJson) {
            $args = @('cloudfront','create-invalidation-for-distribution-tenant','--id', $tid, '--invalidation-batch', ('file://{0}' -f $providedJson))
            if ($Profile) { $args += @('--profile', $Profile) }

            if ($DryRun) {
                Write-Host "[DRY-RUN] aws $($args -join ' ')"
            } else {
                $jsonOut = & aws @args | Out-String
                if ($LASTEXITCODE -ne 0) {
                    throw "create-invalidation-for-distribution-tenant failed for tenant $tid"
                }
                Write-Host ("Created invalidation for tenant {0}" -f $tid)
                $results += [pscustomobject]@{ TenantId = $tid; Result = $jsonOut.Trim() }
            }
        } else {
            $idx = 0
            foreach ($batch in $pathBatches) {
                $idx += 1
                $callerRef = ('tenant-{0}-{1}-{2}' -f $tid, [DateTimeOffset]::UtcNow.ToUnixTimeSeconds(), $idx)
                $tmp = $null
                try {
                    $tmp = New-InvalidationBatchFile -Items $batch -CallerReference $callerRef
                    $args = @('cloudfront','create-invalidation-for-distribution-tenant','--id', $tid, '--invalidation-batch', ('file://{0}' -f $tmp))
                    if ($Profile) { $args += @('--profile', $Profile) }

                    if ($DryRun) {
                        Write-Host "[DRY-RUN] aws $($args -join ' ')"
                    } else {
                        $jsonOut = & aws @args | Out-String
                        if ($LASTEXITCODE -ne 0) {
                            throw "create-invalidation-for-distribution-tenant failed for tenant $tid (batch $idx)"
                        }
                        Write-Host ("Created invalidation for tenant {0} with {1} path(s)" -f $tid, $batch.Count)
                        $results += [pscustomobject]@{ TenantId = $tid; Batch = $idx; Result = $jsonOut.Trim() }
                    }
                } finally {
                    if ($tmp -and (Test-Path -LiteralPath $tmp)) { Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue }
                }
            }
        }
    }

    return $results
}

# Main
Ensure-AwsCli

Write-Host ("Fetching tenants for ConnectionGroupId={0} ..." -f $ConnectionGroupId)
$tenantIds = Get-DistributionTenantIds -ConnGroupId $ConnectionGroupId -Profile $Profile
if (-not $tenantIds -or $tenantIds.Count -eq 0) {
    throw ("No tenants found for ConnectionGroupId={0}" -f $ConnectionGroupId)
}
Write-Host ("Tenants: {0}" -f ($tenantIds -join ', '))

if ($InvalidationJson) {
    Write-Host ("Using batch file: {0}" -f (Resolve-Path -LiteralPath $InvalidationJson).Path)
} else {
    Write-Host ("Paths: {0}" -f ($Paths -join ', '))
}

$summary = Invoke-TenantInvalidations -TenantIds $tenantIds -Profile $Profile -DryRun:$DryRun -InvalidationJson $InvalidationJson -Paths $Paths

if (-not $DryRun) {
    Write-Host ''
    Write-Host 'Summary:'
    foreach ($row in $summary) {
        Write-Host ("Tenant {0}: {1}" -f $row.TenantId, ($row.Result -replace '\s+', ' ').Substring(0, [Math]::Min(120, ($row.Result.Length))))
    }
}
