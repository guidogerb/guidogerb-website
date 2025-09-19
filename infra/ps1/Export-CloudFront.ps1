<#
.SYNOPSIS
  Export a summarized YAML for an AWS CloudFront distribution (tenants/origins/behaviors),
  optionally exporting CloudFront Function metadata and LIVE code.

.USAGE
  .\Export-CloudFront.ps1 -DistributionId E123ABCDEF456
  .\Export-CloudFront.ps1 -DistributionId E123ABCDEF456 -ExportFunctions

.PREREQS
  - AWS CLI v2 installed & configured (`aws configure`)
  - PowerShell module `powershell-yaml`
      Install-Module powershell-yaml -Scope CurrentUser -Force
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$DistributionId,

    [switch]$ExportFunctions
)

# Fail fast if dependencies missing
try { Import-Module powershell-yaml -ErrorAction Stop } catch { throw "Missing module powershell-yaml. Install with: Install-Module powershell-yaml -Scope CurrentUser" }
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) { throw "AWS CLI not found in PATH. Install with winget: winget install Amazon.AWSCLI" }

function New-Dir {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { $null = New-Item -ItemType Directory -Path $Path -Force }
}

Write-Host "Fetching distribution $DistributionId ..." -ForegroundColor Cyan
$rawJson = aws cloudfront get-distribution --id $DistributionId 2>$null
if (-not $rawJson) { throw "Could not retrieve distribution $DistributionId. Check credentials/region/ID." }

$doc  = $rawJson | ConvertFrom-Json
$dist = $doc.Distribution
$cfg  = $dist.DistributionConfig

#--------------------------
# Helpers
#--------------------------
function Get-Items { param($obj, [string]$name)
if ($obj -and $obj.$name -and $obj.$name.Items) { $obj.$name.Items } else { @() }
}
function SafeList {
    param($maybe)
    if ($maybe -and $maybe.Items) { ,$maybe.Items } else { @() }
}
function Map-FunctionAssocs {
    param($behavior)
    $fa = Get-Items $behavior 'FunctionAssociations'
    $out = @()
    foreach ($x in $fa) {
        $out += [pscustomobject]@{
            EventType   = $x.EventType
            FunctionARN = $x.FunctionARN
        }
    }
    ,$out
}
function Map-LambdaAssocs {
    param($behavior)
    $la = Get-Items $behavior 'LambdaFunctionAssociations'
    $out = @()
    foreach ($x in $la) {
        $out += [pscustomobject]@{
            EventType         = $x.EventType
            LambdaFunctionARN = $x.LambdaFunctionARN
        }
    }
    ,$out
}
function Map-Origin {
    param($o)
    $hdrs    = Get-Items $o 'OriginCustomHeaders'
    $hdrObjs = @()
    foreach ($h in $hdrs) { $hdrObjs += [pscustomobject]@{ HeaderName = $h.HeaderName; HeaderValue = $h.HeaderValue } }

    [pscustomobject]@{
        Id                     = $o.Id
        DomainName             = $o.DomainName
        OriginAccessControlId  = $o.OriginAccessControlId
        S3OriginConfig         = $o.S3OriginConfig
        CustomOriginConfig     = $o.CustomOriginConfig
        OriginShield           = $o.OriginShield
        OriginPath             = $o.OriginPath
        ConnectionAttempts     = $o.ConnectionAttempts
        ConnectionTimeout      = $o.ConnectionTimeout
        OriginHeaders          = ,$hdrObjs
    }
}
function Map-Behavior {
    param($b, [bool]$IsDefault = $false)
    [pscustomobject]@{
        PathPattern                 = $(if ($IsDefault) { 'Default' } else { $b.PathPattern })
        TargetOriginId              = $b.TargetOriginId
        AllowedMethods              = (SafeList $b.AllowedMethods)
        CachedMethods               = (SafeList $b.CachedMethods)
        ViewerProtocolPolicy        = $b.ViewerProtocolPolicy
        Compress                    = $b.Compress
        SmoothStreaming             = $b.SmoothStreaming
        RealtimeLogConfigArn        = $b.RealtimeLogConfigArn
        CachePolicyId               = $b.CachePolicyId
        OriginRequestPolicyId       = $b.OriginRequestPolicyId
        ResponseHeadersPolicyId     = $b.ResponseHeadersPolicyId
        ForwardedValues             = $b.ForwardedValues   # legacy if no CachePolicy
        FunctionAssociations        = @( Map-FunctionAssocs $b )
        LambdaFunctionAssociations  = @( Map-LambdaAssocs  $b )
        FieldLevelEncryptionId      = $b.FieldLevelEncryptionId
        MinTTL                      = $b.MinTTL
        DefaultTTL                  = $b.DefaultTTL
        MaxTTL                      = $b.MaxTTL
    }
}

#--------------------------
# Build export object
#--------------------------
$aliases = @()
if ($cfg.Aliases -and $cfg.Aliases.Items) { $aliases = ,$cfg.Aliases.Items }

$origins = @()
foreach ($o in $cfg.Origins.Items) { $origins += (Map-Origin $o) }

$behaviors = @()
$behaviors += (Map-Behavior $cfg.DefaultCacheBehavior $true)
if ($cfg.CacheBehaviors -and $cfg.CacheBehaviors.Items) {
    foreach ($b in $cfg.CacheBehaviors.Items) { $behaviors += (Map-Behavior $b) }
}

$export = [pscustomobject]@{
    Id             = $dist.Id
    ARN            = $dist.ARN
    Status         = $dist.Status
    DomainName     = $dist.DomainName
    Aliases        = $aliases
    Comment        = $cfg.Comment
    IsIPV6Enabled  = $cfg.IsIPV6Enabled
    WebACLId       = $cfg.WebACLId
    PriceClass     = $cfg.PriceClass
    Origins        = $origins
    Behaviors      = $behaviors
}

#--------------------------
# Write YAML (handles all powershell-yaml versions)
#--------------------------
$outDir = "cloudfront-export-$DistributionId"
New-Dir $outDir
$yamlPath = Join-Path $outDir 'distribution-summary.yaml'

$yamlCmd = Get-Command ConvertTo-Yaml -ErrorAction SilentlyContinue
if (-not $yamlCmd) { throw "powershell-yaml module not loaded. Run: Install-Module powershell-yaml -Scope CurrentUser" }
$paramNames = $yamlCmd.Parameters.Keys

try {
    if ($paramNames -contains 'Depth') {
        $yaml = ConvertTo-Yaml -Data $export -Depth 100
    } elseif ($paramNames -contains 'OutDepth') {
        $yaml = ConvertTo-Yaml -Data $export -OutDepth 100
    } else {
        $yaml = ConvertTo-Yaml -Data $export
    }
} catch {
    throw "ConvertTo-Yaml failed: $($_.Exception.Message)"
}

$yaml | Set-Content -LiteralPath $yamlPath -Encoding UTF8
Write-Host "Wrote $yamlPath" -ForegroundColor Green

#--------------------------
# Optional: export CloudFront Functions (metadata + LIVE code)
#--------------------------
if ($ExportFunctions.IsPresent) {
    $fnDir = Join-Path $outDir 'functions'
    New-Dir $fnDir

    $usedFnArns = @()
    foreach ($b in $export.Behaviors) {
        if ($b.FunctionAssociations) {
            foreach ($fa in $b.FunctionAssociations) {
                if ($fa.FunctionARN) { $usedFnArns += $fa.FunctionARN }
            }
        }
    }
    $usedFnArns = $usedFnArns | Sort-Object -Unique

    if ($usedFnArns.Count -eq 0) {
        Write-Host "No CloudFront Functions associated with behaviors." -ForegroundColor Yellow
    } else {
        foreach ($arn in $usedFnArns) {
            $name = ($arn -split '/')[-1]
            Write-Host "Exporting function $name ..." -ForegroundColor Cyan

            # Metadata
            $meta = aws cloudfront describe-function --name $name | Out-String
            $metaPath = Join-Path $fnDir "$name.meta.json"
            $meta | Set-Content -LiteralPath $metaPath -Encoding UTF8

            # LIVE code (base64 -> js)
            $codeB64 = aws cloudfront get-function --name $name --stage LIVE --query 'FunctionCode' --output text 2>$null
            if ($LASTEXITCODE -eq 0 -and $codeB64 -ne $null -and $codeB64 -ne '') {
                $bytes = [Convert]::FromBase64String($codeB64)
                $jsPath = Join-Path $fnDir "$name.js"
                [IO.File]::WriteAllBytes($jsPath, $bytes)
            } else {
                Write-Host "  (No LIVE code available or API error.)" -ForegroundColor DarkYellow
            }
        }
        Write-Host "Function metadata/code saved in $fnDir" -ForegroundColor Green
    }
}

Write-Host "Done." -ForegroundColor Green
