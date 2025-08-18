param(
    [Parameter(Mandatory = $true)]
    [string]$AppId,

# Include this switch to delete the WebACL after detaching
    [switch]$DeleteWebAcl
)

$ErrorActionPreference = 'Stop'

function Info($m){ Write-Host $m -ForegroundColor Cyan }
function Warn($m){ Write-Host $m -ForegroundColor Yellow }
function Err ($m){ Write-Host $m -ForegroundColor Red }

function Get-AllCloudFrontDistributions {
    # Robust pagination over CloudFront ListDistributions (Marker/NextMarker)
    $all = @()
    $marker = $null
    do {
        $args = @('cloudfront','list-distributions','--output','json')
        if ($marker) { $args += @('--marker', $marker) }
        $json = & aws @args
        $obj  = $json | ConvertFrom-Json
        if ($obj.DistributionList -and $obj.DistributionList.Items) {
            $all += $obj.DistributionList.Items
        }
        $marker = $obj.DistributionList.NextMarker
    } while ($marker)
    return $all
}

try {
    Info "Amplify app id: $AppId"

    # 1) Get Amplify default domain
    $DefaultDomain = (aws amplify get-app --app-id $AppId --query 'app.defaultDomain' --output text)
    if (-not $DefaultDomain -or $DefaultDomain -eq "None") {
        throw "Could not read defaultDomain for Amplify app $AppId."
    }
    Info "Default domain: $DefaultDomain"

    # 2) Find CloudFront distribution by Alias (do not rely on DNS)
    Info "Searching CloudFront distributions by Alias..."
    $allDists = Get-AllCloudFrontDistributions
    $dist = $allDists |
            Where-Object { $_.Aliases -and $_.Aliases.Quantity -gt 0 -and $_.Aliases.Items -contains $DefaultDomain } |
            Select-Object -First 1

    # Fallback: try DNS to discover the underlying CloudFront domain, then match by DomainName
    if (-not $dist) {
        Warn "No distribution had Alias '$DefaultDomain'. Trying DNS fallback..."
        $CfDomain = $null
        try {
            $any = Resolve-DnsName -Name $DefaultDomain -Type ANY -ErrorAction Stop
            $CfDomain = ($any | Where-Object { $_.NameHost -like '*.cloudfront.net.' } | Select-Object -First 1).NameHost.TrimEnd('.')
            if (-not $CfDomain) {
                $ns = nslookup $DefaultDomain 2>$null
                $CfDomain = ($ns | Select-String -Pattern '([a-z0-9\-]+\.cloudfront\.net)' -AllMatches).Matches.Value | Select-Object -First 1
            }
        } catch { $CfDomain = $null }

        if ($CfDomain) {
            Info "CloudFront domain via DNS: $CfDomain"
            $dist = $allDists | Where-Object { $_.DomainName -eq $CfDomain } | Select-Object -First 1
        }
    }

    if (-not $dist) {
        throw "Could not find a CloudFront distribution for '$DefaultDomain' via Alias or DNS."
    }

    $DistId = $dist.Id
    Info "Distribution ID: $DistId"

    # 3) Build ARN and check for associated WebACL
    $AccountId = (aws sts get-caller-identity --query Account --output text)
    $DistArn   = "arn:aws:cloudfront::$AccountId:distribution/$DistId"

    Info "Checking associated WebACL..."
    $wafJson = aws wafv2 get-web-acl-for-resource --resource-arn $DistArn --region us-east-1 --output json 2>$null

    if (-not $wafJson) {
        Warn "No WebACL associated with distribution $DistId."
        return
    }

    $waf = $wafJson | ConvertFrom-Json
    if (-not $waf.WebACL) {
        Warn "No WebACL associated with distribution $DistId."
        return
    }

    $WebAclId   = $waf.WebACL.Id
    $WebAclName = $waf.WebACL.Name
    $WebAclArn  = $waf.WebACL.ARN
    Info "Found WebACL: $WebAclName ($WebAclId)"

    # 4) Disassociate WebACL
    Info "Disassociating WebACL from distribution..."
    aws wafv2 disassociate-web-acl --resource-arn $DistArn --region us-east-1 | Out-Null
    Info "Disassociated."

    # 5) Optional: delete WebACL
    if ($DeleteWebAcl) {
        Info "Fetching LockToken for delete..."
        $LockToken = aws wafv2 get-web-acl --name $WebAclName --scope CLOUDFRONT --id $WebAclId --region us-east-1 --query 'LockToken' --output text
        if (-not $LockToken) { throw "Could not fetch LockToken for WebACL $WebAclName ($WebAclId)." }

        Info "Deleting WebACL $WebAclName ($WebAclId)..."
        aws wafv2 delete-web-acl --name $WebAclName --scope CLOUDFRONT --id $WebAclId --lock-token $LockToken --region us-east-1 | Out-Null
        Info "Deleted WebACL."
    } else {
        Warn "Detached only (use -DeleteWebAcl to also delete the WebACL)."
    }

} catch {
    Err "ERROR: $($_.Exception.Message)"
    exit 1
}
