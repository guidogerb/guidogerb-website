<#
.SYNOPSIS
  Validates input and scaffolds CloudFront tenant provisioning automation.

.DESCRIPTION
  `AddCF-Tenant.ps1` validates the tenant contract and, when requested, generates a
  Vite/React workspace wired to the shared <AppBasic /> shell. The automation
  updates pnpm workspaces, build scripts, CloudFront distribution metadata, and
  local development assets so new tenants immediately participate in repository
  workflows. Downstream CI/CD and regression tasks rely on the deterministic
  scaffolding produced by this command.

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

.PARAMETER RepoRoot
  Optional override for the repository root. Primarily used by integration
  tests and automation that invoke the script against a temporary worktree
  rather than the canonical checkout inferred from the script location.

.PARAMETER ValidateOnly
  Skips scaffolding and only performs validation. The validated contract is
  still emitted so callers can inspect the resolved workspace metadata.

.NOTES
  Implementation is tracked in infra/ps1/tasks.md. Provisioning steps are still
  pending; this script currently enforces the input contract, scaffolds the
  workspace, and updates repository wiring so subsequent automation can rely on
  validated inputs.
#>

[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'High')]
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
    $EnvSecretKeys,

    [ValidateNotNullOrWhiteSpace()]
    [string]
    $RepoRoot,

    [switch]
    $ValidateOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:PSCmdlet = $PSCmdlet
$script:Utf8NoBomEncoding = [System.Text.UTF8Encoding]::new($false)

function Get-TenantSlug {
    param(
        [Parameter(Mandatory = $true)]
        [string]
        $Domain
    )

    $lower = $Domain.ToLowerInvariant()
    $parts = $lower.Split('.', [System.StringSplitOptions]::RemoveEmptyEntries)
    if ($parts.Length -lt 1) {
        $parts = @($lower)
    }

    $commonTlds = @('com', 'org', 'net', 'app', 'dev', 'io')
    if ($parts.Length -eq 2 -and $commonTlds -contains $parts[1]) {
        $candidate = $parts[0]
    }
    else {
        $candidate = ($parts -join '-')
    }

    $normalized = ($candidate -replace '[^a-z0-9-]', '-')
    $normalized = $normalized -replace '-{2,}', '-'
    $normalized = $normalized.Trim('-')

    if ([string]::IsNullOrWhiteSpace($normalized)) {
        $normalized = ($lower -replace '[^a-z0-9-]', '-')
        $normalized = $normalized -replace '-{2,}', '-'
        $normalized = $normalized.Trim('-')
    }

    if ([string]::IsNullOrWhiteSpace($normalized)) {
        throw "Unable to derive a workspace slug from domain '$Domain'."
    }

    return $normalized
}

function Get-SecretFileName {
    param(
        [Parameter(Mandatory = $true)]
        [string]
        $Domain
    )

    $sanitized = ($Domain.ToUpperInvariant() -replace '[^A-Z0-9]+', '_').Trim('_')
    if ([string]::IsNullOrWhiteSpace($sanitized)) {
        $sanitized = 'TENANT'
    }

    return "${sanitized}_VITE_ENV-secrets"
}

function Get-TenantSecretName {
    param(
        [Parameter(Mandatory = $true)]
        [string]
        $Domain
    )

    $sanitized = ($Domain.ToUpperInvariant() -replace '[^A-Z0-9]+', '_').Trim('_')
    if ([string]::IsNullOrWhiteSpace($sanitized)) {
        throw "Unable to derive a secret name from domain '$Domain'."
    }

    return "${sanitized}_VITE_ENV"
}

function ConvertTo-JsStringLiteral {
    param(
        [Parameter(Mandatory = $true)]
        [string]
        $Value
    )

    $escaped = $Value -replace '\', '\\'
    $escaped = $escaped -replace "'", "\'"
    return "'$escaped'"
}

function Ensure-Directory {
    param(
        [Parameter(Mandatory = $true)]
        [string]
        $Path
    )

    if (Test-Path -Path $Path -PathType Container) {
        return
    }

    if ($script:PSCmdlet.ShouldProcess($Path, 'Create directory')) {
        [System.IO.Directory]::CreateDirectory($Path) | Out-Null
    }
}

function Write-TextFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]
        $Path,

        [Parameter(Mandatory = $true)]
        [object]
        $Content,

        [switch]
        $AllowOverwrite
    )

    $directory = Split-Path -Parent $Path
    if ($directory -and -not (Test-Path -Path $directory -PathType Container)) {
        Ensure-Directory -Path $directory
    }

    if (-not $AllowOverwrite -and (Test-Path -Path $Path)) {
        throw "File '$Path' already exists. Remove it before scaffolding or rerun after cleanup."
    }

    $text = if ($Content -is [string]) {
        [string]$Content
    }
    elseif ($Content -is [System.Collections.IEnumerable]) {
        ($Content | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine
    }
    else {
        [string]$Content
    }

    if (-not $text.EndsWith([Environment]::NewLine)) {
        $text += [Environment]::NewLine
    }

    if ($script:PSCmdlet.ShouldProcess($Path, 'Write file')) {
        [System.IO.File]::WriteAllText($Path, $text, $script:Utf8NoBomEncoding)
    }
}


function Update-RootPackageJson {
    param(
        [Parameter(Mandatory = $true)]
        [string]
        $RepoRoot,

        [Parameter(Mandatory = $true)]
        [pscustomobject]
        $Tenant
    )

    $packagePath = Join-Path $RepoRoot 'package.json'
    $raw = Get-Content -Path $packagePath -Raw
    $json = [System.Text.Json.Nodes.JsonNode]::Parse($raw)
    if (-not $json) {
        throw "Unable to parse package.json at '$packagePath'."
    }

    $workspaceEntry = "websites/$($Tenant.Domain)"
    $workspacesNode = [System.Text.Json.Nodes.JsonArray]$json['workspaces']
    if (-not $workspacesNode) {
        throw "Root package.json must declare a workspaces array."
    }

    $workspaceEntries = @()
    foreach ($item in $workspacesNode) {
        $workspaceEntries += [string]$item
    }
    if (-not ($workspaceEntries -contains $workspaceEntry)) {
        $workspaceEntries += $workspaceEntry
    }

    $nonWebsite = @()
    foreach ($entry in $workspaceEntries) {
        if ($entry -notlike 'websites/*' -and -not ($nonWebsite -contains $entry)) {
            $nonWebsite += $entry
        }
    }

    $websiteEntries = ($workspaceEntries | Where-Object { $_ -like 'websites/*' }) |
        Sort-Object -Unique

    $newWorkspacesNode = [System.Text.Json.Nodes.JsonArray]::new()
    foreach ($entry in $nonWebsite) {
        $newWorkspacesNode.Add($entry) | Out-Null
    }
    foreach ($entry in $websiteEntries) {
        $newWorkspacesNode.Add($entry) | Out-Null
    }
    $json['workspaces'] = $newWorkspacesNode

    $scriptsNode = [System.Text.Json.Nodes.JsonObject]$json['scripts']
    if (-not $scriptsNode) {
        $scriptsNode = [System.Text.Json.Nodes.JsonObject]::new()
        $json['scripts'] = $scriptsNode
    }

    $packageRef = "websites-$($Tenant.WorkspaceSlug)"
    $buildKey = "build:site:$($Tenant.ScriptSlug)"
    $devKey = "dev:site:$($Tenant.ScriptSlug)"

    $scriptsNode[$buildKey] = "pnpm --filter $packageRef build"
    $scriptsNode[$devKey] = "pnpm --filter $packageRef dev"

    $options = [System.Text.Json.JsonSerializerOptions]::new()
    $options.WriteIndented = $true
    $options.Encoder = [System.Text.Encodings.Web.JavaScriptEncoder]::UnsafeRelaxedJsonEscaping

    $updated = [System.Text.Json.JsonSerializer]::Serialize($json, $options)
    if (-not $updated.EndsWith([Environment]::NewLine)) {
        $updated += [Environment]::NewLine
    }

    if ($script:PSCmdlet.ShouldProcess($packagePath, 'Update package.json workspaces and scripts')) {
        [System.IO.File]::WriteAllText($packagePath, $updated, $script:Utf8NoBomEncoding)
    }
}

function Update-CfDistributionsFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]
        $RepoRoot,

        [Parameter(Mandatory = $true)]
        [pscustomobject]
        $Tenant
    )

    $cfPath = Join-Path $RepoRoot 'infra/ps1/cf-distributions.json'
    $raw = Get-Content -Path $cfPath -Raw
    $map = if ([string]::IsNullOrWhiteSpace($raw)) {
        @{}
    }
    else {
        Get-Content -Path $cfPath -Raw | ConvertFrom-Json -AsHashtable
    }

    $map[$Tenant.Domain] = $Tenant.DistributionId

    $ordered = [ordered]@{}
    foreach ($key in ($map.Keys | Sort-Object)) {
        $ordered[$key] = $map[$key]
    }

    $json = ($ordered | ConvertTo-Json -Depth 5)
    if (-not $json.EndsWith([Environment]::NewLine)) {
        $json += [Environment]::NewLine
    }

    if ($script:PSCmdlet.ShouldProcess($cfPath, 'Update CloudFront distribution registry')) {
        [System.IO.File]::WriteAllText($cfPath, $json, $script:Utf8NoBomEncoding)
    }
}

function Update-TenantManifest {
    param(
        [Parameter(Mandatory = $true)]
        [string]
        $RepoRoot,

        [Parameter(Mandatory = $true)]
        [pscustomobject]
        $Tenant,

        [Parameter(Mandatory = $true)]
        [string[]]
        $EnvSecretKeys
    )

    $manifestPath = Join-Path $RepoRoot 'infra/ps1/tenant-manifest.json'
    $entries = @()

    if (Test-Path -Path $manifestPath -PathType Leaf) {
        $rawManifest = Get-Content -Path $manifestPath -Raw
        if (-not [string]::IsNullOrWhiteSpace($rawManifest)) {
            $parsed = $rawManifest | ConvertFrom-Json
            if ($parsed -is [System.Collections.IEnumerable]) {
                foreach ($entry in $parsed) {
                    if ($null -eq $entry) { continue }
                    if ([string]::IsNullOrWhiteSpace($entry.domain)) {
                        continue
                    }
                    if ($entry.domain -ieq $Tenant.Domain) {
                        continue
                    }

                    $existingKeys = @()
                    if ($entry.PSObject.Properties.Name -contains 'envSecretKeys') {
                        foreach ($key in $entry.envSecretKeys) {
                            if ([string]::IsNullOrWhiteSpace($key)) { continue }
                            $existingKeys += [string]$key
                        }
                    }

                    $entries += ,([ordered]@{
                        domain = [string]$entry.domain
                        displayName = [string]$entry.displayName
                        distributionId = [string]$entry.distributionId
                        workspaceSlug = [string]$entry.workspaceSlug
                        workspacePackage = [string]$entry.workspacePackage
                        workspaceDirectory = [string]$entry.workspaceDirectory
                        scriptSlug = [string]$entry.scriptSlug
                        secretFileName = [string]$entry.secretFileName
                        secretName = [string]$entry.secretName
                        envSecretKeys = $existingKeys
                        supportEmail = [string]$entry.supportEmail
                    })
                }
            }
        }
    }

    $entries += ,([ordered]@{
        domain = $Tenant.Domain
        displayName = $Tenant.DisplayName
        distributionId = $Tenant.DistributionId
        workspaceSlug = $Tenant.WorkspaceSlug
        workspacePackage = $Tenant.PackageName
        workspaceDirectory = "websites/$($Tenant.Domain)"
        scriptSlug = $Tenant.ScriptSlug
        secretFileName = $Tenant.SecretFileName
        secretName = $Tenant.SecretName
        envSecretKeys = [string[]]$EnvSecretKeys
        supportEmail = $Tenant.SupportEmail
    })

    $sorted = $entries | Sort-Object -Property { $_['domain'] }
    $json = ($sorted | ConvertTo-Json -Depth 10)
    if (-not $json.EndsWith([Environment]::NewLine)) {
        $json += [Environment]::NewLine
    }

    Write-TextFile -Path $manifestPath -Content $json -AllowOverwrite
}

function Update-WebsitesReadme {
    param(
        [Parameter(Mandatory = $true)]
        [string]
        $RepoRoot,

        [Parameter(Mandatory = $true)]
        [pscustomobject]
        $Tenant
    )

    $readmePath = Join-Path $RepoRoot 'websites/README.md'
    $lines = Get-Content -Path $readmePath

    $sectionIndex = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^##\s+Current tenants') {
            $sectionIndex = $i
            break
        }
    }
    if ($sectionIndex -lt 0) {
        throw "Unable to locate 'Current tenants' section in websites/README.md."
    }

    $listStart = $sectionIndex + 1
    while ($listStart -lt $lines.Count -and [string]::IsNullOrWhiteSpace($lines[$listStart])) {
        $listStart++
    }

    $listEnd = $listStart
    $domains = @()
    while ($listEnd -lt $lines.Count) {
        $line = $lines[$listEnd]
        if ($line -notmatch '^\s*-\s+`') {
            break
        }
        if ($line -match '`([^`]+)`') {
            $domains += $matches[1]
        }
        $listEnd++
    }

    if (-not ($domains -contains $Tenant.Domain)) {
        $domains += $Tenant.Domain
    }

    $sorted = $domains | Sort-Object -Unique
    $bulletLines = $sorted | ForEach-Object { "- `$_`" }

    $updatedLines = New-Object System.Collections.Generic.List[string]
    for ($i = 0; $i -lt $listStart; $i++) {
        $updatedLines.Add($lines[$i]) | Out-Null
    }
    foreach ($bullet in $bulletLines) {
        $updatedLines.Add($bullet) | Out-Null
    }
    if ($listEnd -lt $lines.Count) {
        for ($i = $listEnd; $i -lt $lines.Count; $i++) {
            $updatedLines.Add($lines[$i]) | Out-Null
        }
    }

    Write-TextFile -Path $readmePath -Content $updatedLines -AllowOverwrite
}

function Update-SyncSitesScript {
    param(
        [Parameter(Mandatory = $true)]
        [string]
        $RepoRoot,

        [Parameter(Mandatory = $true)]
        [pscustomobject]
        $Tenant
    )

    $scriptPath = Join-Path $RepoRoot 'infra/local-dev/scripts/sync-sites.sh'
    $lines = Get-Content -Path $scriptPath

    $sitesStart = -1
    $sitesPattern = '^\s*(?:declare\s+-a\s+|readonly\s+|local\s+-r\s+|local\s+)?SITES\s*=\s*\('

    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match $sitesPattern) {
            $sitesStart = $i
            break
        }
    }
    if ($sitesStart -lt 0) {
        throw [System.InvalidOperationException]::new('Unable to locate SITES array in sync-sites.sh.')
    }

    $sitesEnd = $sitesStart + 1
    while ($sitesEnd -lt $lines.Count -and $lines[$sitesEnd].Trim() -ne ')') {
        $sitesEnd++
    }
    if ($sitesEnd -ge $lines.Count) {
        throw [System.InvalidOperationException]::new('Malformed SITES array in sync-sites.sh.')
    }

    $siteEntries = @()
    for ($i = $sitesStart + 1; $i -lt $sitesEnd; $i++) {
        if ($lines[$i] -match '"([^"]+)"') {
            $siteEntries += $matches[1]
        }
    }
    if (-not ($siteEntries -contains $Tenant.Domain)) {
        $siteEntries += $Tenant.Domain
    }
    $siteEntries = $siteEntries | Sort-Object -Unique

    $siteBlock = @('SITES=(')
    foreach ($site in $siteEntries) {
        $siteBlock += "  `"$site`""
    }
    $siteBlock += ')'

    $caseStart = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^\s*case "\$1" in') {
            $caseStart = $i
            break
        }
    }
    if ($caseStart -lt 0) {
        throw [System.InvalidOperationException]::new('Unable to locate workspace_name_for_site case statement.')
    }

    $caseEnd = $caseStart + 1
    while ($caseEnd -lt $lines.Count -and $lines[$caseEnd] -notmatch '^\s*\*\)') {
        $caseEnd++
    }
    if ($caseEnd -ge $lines.Count) {
        throw [System.InvalidOperationException]::new('Malformed case block in sync-sites.sh.')
    }

    $mappings = @{}
    for ($i = $caseStart + 1; $i -lt $caseEnd; $i++) {
        if ($lines[$i] -match '^\s*"([^"]+)"\)\s+echo\s+"([^"]+)"\s+;;') {
            $mappings[$matches[1]] = $matches[2]
        }
    }
    $mappings[$Tenant.Domain] = "websites-$($Tenant.WorkspaceSlug)"

    $sortedMappings = $mappings.GetEnumerator() | Sort-Object -Property Key
    $caseLines = @('  case "$1" in')
    foreach ($mapping in $sortedMappings) {
        $caseLines += "    `"$($mapping.Key)`") echo `"$($mapping.Value)`" ;;"
    }
    $caseLines += '    *) return 1 ;;'

    $updated = New-Object System.Collections.Generic.List[string]
    for ($i = 0; $i -lt $sitesStart; $i++) {
        $updated.Add($lines[$i]) | Out-Null
    }
    foreach ($line in $siteBlock) {
        $updated.Add($line) | Out-Null
    }
    for ($i = $sitesEnd + 1; $i -lt $caseStart; $i++) {
        $updated.Add($lines[$i]) | Out-Null
    }
    foreach ($line in $caseLines) {
        $updated.Add($line) | Out-Null
    }
    for ($i = $caseEnd + 1; $i -lt $lines.Count; $i++) {
        $updated.Add($lines[$i]) | Out-Null
    }

    Write-TextFile -Path $scriptPath -Content $updated -AllowOverwrite
}

function Update-CloudFrontConfig {
    param(
        [Parameter(Mandatory = $true)]
        [string]
        $RepoRoot,

        [Parameter(Mandatory = $true)]
        [pscustomobject]
        $Tenant
    )

    $configPath = Join-Path $RepoRoot 'infra/local-dev/cloudfront/nginx.conf'
    $lines = Get-Content -Path $configPath

    $mapStart = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^\s*map\s+\$host\s+\$tenant_name\s+\{') {
            $mapStart = $i
            break
        }
    }
    if ($mapStart -lt 0) {
        throw "Unable to locate tenant map block in cloudfront/nginx.conf."
    }

    $mapEnd = $mapStart + 1
    while ($mapEnd -lt $lines.Count -and $lines[$mapEnd] -notmatch '^\s*\}') {
        $mapEnd++
    }
    if ($mapEnd -ge $lines.Count) {
        throw "Malformed tenant map block in cloudfront/nginx.conf."
    }

    $entries = @{}
    for ($i = $mapStart + 1; $i -lt $mapEnd; $i++) {
        $line = $lines[$i].Trim()
        if ([string]::IsNullOrWhiteSpace($line) -or $line -like 'default*') {
            continue
        }
        if ($line -match '^([^\s;]+)\s+([^\s;]+);$') {
            $entries[$matches[1]] = $matches[2]
        }
    }

    $entries["local.$($Tenant.Domain)"] = $Tenant.Domain
    $entries["api.local.$($Tenant.Domain)"] = $Tenant.Domain
    $entries["app.local.$($Tenant.Domain)"] = $Tenant.Domain

    $mapLines = @('    map $host $tenant_name {', '        default "";')
    foreach ($host in ($entries.Keys | Sort-Object)) {
        $mapLines += "        $host $($entries[$host]);"
    }
    $mapLines += '    }'

    $updatedLines = @()
    if ($mapStart -gt 0) {
        $updatedLines += $lines[0..($mapStart - 1)]
    }
    $updatedLines += $mapLines
    if ($mapEnd + 1 -le $lines.Count - 1) {
        $updatedLines += $lines[($mapEnd + 1)..($lines.Count - 1)]
    }

    $addHosts = @{
        'local' = "local.$($Tenant.Domain)"
        'api'   = "api.local.$($Tenant.Domain)"
        'app'   = "app.local.$($Tenant.Domain)"
    }

    for ($i = 0; $i -lt $updatedLines.Count; $i++) {
        $line = $updatedLines[$i]
        if ($line -match '^\s*server_name\s+(.+);') {
            $hosts = $matches[1].Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)
            $target = $null
            if ($line -match 'server_name\s+local\.' -and $line -notmatch 'api\.local' -and $line -notmatch 'app\.local') {
                $target = $addHosts['local']
            }
            elseif ($line -match 'server_name\s+api\.local') {
                $target = $addHosts['api']
            }
            elseif ($line -match 'server_name\s+app\.local') {
                $target = $addHosts['app']
            }

            if ($null -ne $target -and -not ($hosts -contains $target)) {
                $hosts += $target
                $hosts = $hosts | Sort-Object -Unique
                $prefixMatch = [regex]::Match($line, '^(\s*server_name\s+)')
                $prefix = if ($prefixMatch.Success) { $prefixMatch.Groups[1].Value } else { '        server_name  ' }
                $indent = $line.Substring(0, $line.IndexOf('server_name'))
                $updatedLines[$i] = "$indent$prefix$($hosts -join ' ')" + ';'
            }
        }
    }

    Write-TextFile -Path $configPath -Content $updatedLines -AllowOverwrite
}

function Update-S3Config {
    param(
        [Parameter(Mandatory = $true)]
        [string]
        $RepoRoot,

        [Parameter(Mandatory = $true)]
        [pscustomobject]
        $Tenant
    )

    $configPath = Join-Path $RepoRoot 'infra/local-dev/s3/nginx.conf'
    $lines = Get-Content -Path $configPath

    $serverBlocks = @()
    $defaultBlock = @()
    $prefixLines = @()

    $currentBlock = @()
    $collecting = $false
    foreach ($line in $lines) {
        if (-not $collecting -and $line -match '^\s*server\s*\{') {
            $collecting = $true
            $currentBlock = @($line)
            continue
        }

        if ($collecting) {
            $currentBlock += $line
            if ($line -match '^\s*\}') {
                if ($currentBlock -join "`n" -match 'default_server') {
                    $defaultBlock = $currentBlock
                }
                else {
                    $serverBlocks += ,@{ Lines = $currentBlock }
                }
                $collecting = $false
                $currentBlock = @()
            }
            continue
        }

        $prefixLines += $line
    }

    $hosts = @()
    foreach ($block in $serverBlocks) {
        $line = ($block.Lines | Where-Object { $_ -match 'server_name' })
        if ($line -match 'server_name\s+([^;]+);') {
            $hosts += ($matches[1].Trim())
        }
    }

    $desiredHost = "local.$($Tenant.Domain)"
    if (-not ($hosts -contains $desiredHost)) {
        $hosts += $desiredHost
    }
    $hosts = $hosts | Sort-Object -Unique

    $renderedBlocks = @()
    foreach ($host in $hosts) {
        $renderedBlocks += @(
            '    server {',
            '        listen       8080;',
            "        server_name  $host;",
            "        root         /var/www/sites/tenants/$host;",
            '        index        index.html;',
            '',
            '        location / {',
            '            try_files $uri $uri/ /index.html;',
            "            add_header X-S3-Simulated-Bucket \"$host\" always;",
            '        }',
            '    }',
            ''
        )
    }

    $newContent = @()
    if ($prefixLines.Count -gt 0) {
        $newContent += $prefixLines
        if ($newContent[-1] -ne '') {
            $newContent += ''
        }
    }
    $newContent += $renderedBlocks
    if ($defaultBlock.Count -gt 0) {
        if ($newContent[-1] -ne '') {
            $newContent += ''
        }
        $newContent += $defaultBlock
    }

    Write-TextFile -Path $configPath -Content $newContent -AllowOverwrite
}


function New-TenantWorkspace {
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject]
        $Tenant,

        [Parameter(Mandatory = $true)]
        [string[]]
        $EnvSecretKeys
    )

    Ensure-Directory -Path $Tenant.WorkspacePath
    Ensure-Directory -Path (Join-Path $Tenant.WorkspacePath 'src')
    Ensure-Directory -Path (Join-Path $Tenant.WorkspacePath 'public')

    $packageJson = @"
{
  "name": "$($Tenant.PackageName)",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "clean": "rimraf package-lock.json node_modules dist",
    "dev": "vite",
    "build": "vite build",
    "build:staging": "vite build --mode staging",
    "build:prod-bundle": "vite build --mode production-bundle",
    "prepreview": "npm run build",
    "preview": "vite preview --strictPort",
    "lint": "pnpm exec eslint . --ext .js,.jsx --max-warnings=0",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@guidogerb/components-app": "workspace:*",
    "react": "^19.1.1",
    "react-dom": "^19.1.1"
  },
  "devDependencies": {
    "@eslint/js": "^9.33.0",
    "@types/react": "^19.1.10",
    "@types/react-dom": "^19.1.7",
    "@vitejs/plugin-react": "^5.0.0",
    "eslint": "^9.33.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "globals": "^16.3.0",
    "vite": "^7.1.2",
    "vite-plugin-mkcert": "^1.17.8",
    "vitest": "^3.2.4"
  }
}
"@

    $readme = @"
# $($Tenant.DisplayName) — Vite tenant

This workspace was generated by AddCF-Tenant.ps1 for the $($Tenant.Domain) CloudFront tenant. It boots on top of the shared <AppBasic /> shell exported from `@guidogerb/components-app` and is ready for tenant-specific marketing and dashboard wiring.

## Local development

```bash
pnpm --filter websites/$($Tenant.Domain) install
pnpm --filter websites/$($Tenant.Domain) dev
```

Create a `.env` file from `.env.example` and populate the credentials tracked in `$($Tenant.SecretFileName)`.

## Build commands

```bash
pnpm --filter websites/$($Tenant.Domain) build
pnpm --filter websites/$($Tenant.Domain) preview
```

## Next steps

- Update `src/tenantPlan.js` with navigation, marketing content, and dashboard modules specific to $($Tenant.DisplayName).
- Replace this README with tenant-focused onboarding details and operational notes.
- Configure GitHub and secrets management entries for the environment keys generated alongside this workspace.
"@

    $today = (Get-Date -Format 'yyyy-MM-dd')
    $tasks = @"
# $($Tenant.DisplayName) — Tasks

| name | createdDate | lastUpdatedDate | completedDate | status | description |
| --- | --- | --- | --- | --- | --- |
| Customize automation scaffold | $today | $today | - | planned | Tailor navigation, marketing copy, routes, and secrets generated by AddCF-Tenant.ps1 to match the tenant launch plan. |
"@

    $envDefaults = [ordered]@{
        'VITE_ENABLE_SW' = 'false'
        'VITE_SITE_DOMAIN' = $Tenant.Domain
        'VITE_SITE_URL' = "https://$($Tenant.Domain)"
        'VITE_SITE_PORT' = '443'
        'VITE_LOGIN_CALLBACK_PATH' = '/auth/callback'
        'VITE_REDIRECT_URI' = "https://$($Tenant.Domain)/auth/callback"
        'VITE_LOGOUT_URI' = "https://$($Tenant.Domain)/auth/logout"
        'VITE_COGNITO_POST_LOGOUT_REDIRECT_URI' = "https://$($Tenant.Domain)/"
        'VITE_RESPONSE_TYPE' = 'code'
        'VITE_COGNITO_SCOPE' = 'openid profile email'
        'VITE_COGNITO_AUTHORITY' = ''
        'VITE_COGNITO_METADATA_URL' = ''
        'VITE_COGNITO_CLIENT_ID' = ''
        'VITE_API_BASE_URL' = ''
        'VITE_BASE_PATH' = '/'
    }

    $envOrder = New-Object System.Collections.Generic.List[string]
    foreach ($key in $envDefaults.Keys) {
        $envOrder.Add($key) | Out-Null
    }

    foreach ($key in $EnvSecretKeys) {
        if (-not $envDefaults.Contains($key)) {
            $envDefaults[$key] = ''
        }
        if (-not $envOrder.Contains($key)) {
            $envOrder.Add($key) | Out-Null
        }
    }

    $envLines = foreach ($key in $envOrder) {
        "$key=$($envDefaults[$key])"
    }

    $secretLines = foreach ($key in $envOrder) {
        $value = switch ($key) {
            'VITE_SITE_DOMAIN' { $Tenant.Domain }
            'VITE_SITE_URL' { "https://$($Tenant.Domain)" }
            'VITE_SITE_PORT' { '443' }
            'VITE_LOGIN_CALLBACK_PATH' { '/auth/callback' }
            'VITE_REDIRECT_URI' { "https://$($Tenant.Domain)/auth/callback" }
            'VITE_LOGOUT_URI' { "https://$($Tenant.Domain)/auth/logout" }
            'VITE_COGNITO_POST_LOGOUT_REDIRECT_URI' { "https://$($Tenant.Domain)/" }
            'VITE_ENABLE_SW' { 'false' }
            'VITE_BASE_PATH' { '/' }
            default { '' }
        }
        "$key=$value"
    }

    $indexHtml = @"
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>$($Tenant.DisplayName)</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
"@

    $viteConfig = @"
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

function restrictHosts(allowed) {
  return {
    name: 'restrict-hosts',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const requestHost = (req.headers.host || '').split(':')[0].toLowerCase()
        if (requestHost && !allowed.includes(requestHost)) {
          res.statusCode = 403
          res.end('Forbidden')
          return
        }
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const requestHost = (req.headers.host || '').split(':')[0].toLowerCase()
        if (requestHost && !allowed.includes(requestHost)) {
          res.statusCode = 403
          res.end('Forbidden')
          return
        }
        next()
      })
    },
  }
}

function printPreviewUrl(hostname) {
  return {
    name: 'print-preview-url',
    configurePreviewServer(server) {
      server.httpServer?.once('listening', () => {
        console.log(`  ➜  Preview: https://${hostname}/`)
      })
    },
  }
}

export default ({ mode }) => {
  const host = '$($Tenant.Domain)'
  const localHost = `local.${host}`
  const wildcardLocalHost = `*.local.${host}`
  const allowedHosts = [localHost]
  const env = loadEnv(mode, process.cwd(), '')

  let build = {
    sourcemap: mode !== 'production',
    minify: mode === 'production' ? 'esbuild' : false,
  }

  if (mode === 'staging') {
    build = {
      sourcemap: true,
      minify: false,
      cssCodeSplit: true,
    }
  }

  if (mode === 'production-bundle') {
    build = {
      sourcemap: false,
      minify: 'esbuild',
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
          manualChunks: undefined,
          entryFileNames: 'assets/app.[hash].js',
          chunkFileNames: 'assets/app.[hash].js',
          assetFileNames: 'assets/[name].[hash][extname]',
        },
      },
    }
  }

  return defineConfig({
    logLevel: 'silent',
    resolve: {
      conditions: [mode],
    },
    plugins: [
      react(),
      mkcert({
        force: true,
        hosts: [localHost, wildcardLocalHost, '127.0.0.1'],
      }),
      restrictHosts(allowedHosts),
      printPreviewUrl(localHost),
    ],
    base: env.VITE_BASE_PATH || '/',
    server: {
      https: true,
      host: true,
      port: 443,
      strictPort: true,
      open: false,
      allowedHosts,
    },
    preview: {
      https: true,
      host: true,
      port: 443,
      strictPort: true,
      open: false,
    },
    build,
  })
}
"@

    $vitestConfig = @"
import { mergeConfig } from 'vitest/config'
import rootConfig from '../../vitest.config.mjs'

export default mergeConfig(rootConfig, {
  test: {
    environment: 'jsdom',
  },
})
"@

    $eslintConfig = @"
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        process: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
"@

    $mainJs = @"
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
"@

    $appJs = @"
import { useMemo } from 'react'
import { AppBasic } from '@guidogerb/components-app'
import { createTenantPlan } from './tenantPlan.js'

export default function App() {
  const plan = useMemo(() => createTenantPlan(), [])
  return <AppBasic {...plan} />
}
"@

    $css = @"
* {
  box-sizing: border-box;
}

:root {
  font-family:
    'Inter',
    'Segoe UI',
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Helvetica Neue',
    Arial,
    sans-serif;
  line-height: 1.55;
  font-weight: 400;
  color: #f4f6ff;
  background-color: #050815;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(45, 76, 179, 0.35), transparent 55%),
    linear-gradient(180deg, #050815 0%, #070a1c 65%, #03050d 100%);
  color: inherit;
}

#root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

a {
  color: #7fa7ff;
}

a:hover {
  color: #5c84e6;
}
"@

    $tenantDomainLiteral = ConvertTo-JsStringLiteral $Tenant.Domain
    $displayNameLiteral = ConvertTo-JsStringLiteral $Tenant.DisplayName
    $supportEmailLiteral = ConvertTo-JsStringLiteral $Tenant.SupportEmail

    $tenantPlan = @"
const TENANT_DOMAIN = $tenantDomainLiteral
const TENANT_DISPLAY_NAME = $displayNameLiteral
const SUPPORT_EMAIL = $supportEmailLiteral

const DEFAULT_NAVIGATION_ITEMS = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'support', label: 'Support', href: 'mailto:' + SUPPORT_EMAIL, external: true },
]

export function createTenantPlan(env = import.meta.env) {
  const siteDomain = env.VITE_SITE_DOMAIN || TENANT_DOMAIN
  const siteUrl = env.VITE_SITE_URL || `https://${siteDomain}`
  const loginCallbackPath = env.VITE_LOGIN_CALLBACK_PATH || '/auth/callback'
  const redirectUri = env.VITE_REDIRECT_URI || `${siteUrl}${loginCallbackPath}`
  const postLogoutRedirectUri = env.VITE_COGNITO_POST_LOGOUT_REDIRECT_URI || siteUrl

  return {
    api: {
      baseUrl: env.VITE_API_BASE_URL || 'https://api.guidogerb.dev/',
    },
    auth: {
      authority: env.VITE_COGNITO_AUTHORITY,
      metadataUrl: env.VITE_COGNITO_METADATA_URL || env.VITE_COGNITO_AUTHORITY || undefined,
      clientId: env.VITE_COGNITO_CLIENT_ID,
      redirectUri,
      responseType: env.VITE_RESPONSE_TYPE || 'code',
      scope: env.VITE_COGNITO_SCOPE || 'openid profile email',
      postLogoutRedirectUri,
      logoutUri: env.VITE_LOGOUT_URI || `${siteUrl}/auth/logout`,
    },
    navigation: {
      items: DEFAULT_NAVIGATION_ITEMS,
    },
    header: {
      settings: {
        brand: {
          title: TENANT_DISPLAY_NAME,
          tagline: 'Stories in motion for modern audiences.',
          href: '/',
        },
      },
    },
    footer: {
      brand: { name: TENANT_DISPLAY_NAME, href: '/' },
      description: 'Replace this placeholder copy with tenant-specific storytelling highlights.',
      socialLinks: [
        { label: 'Email', href: 'mailto:' + SUPPORT_EMAIL, external: true },
      ],
      legalLinks: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
      ],
    },
    serviceWorker: {
      enabled: env.VITE_ENABLE_SW === 'true',
    },
  }
}

export default createTenantPlan
"@

    Write-TextFile -Path (Join-Path $Tenant.WorkspacePath 'package.json') -Content $packageJson
    Write-TextFile -Path (Join-Path $Tenant.WorkspacePath 'README.md') -Content $readme
    Write-TextFile -Path (Join-Path $Tenant.WorkspacePath 'tasks.md') -Content $tasks
    Write-TextFile -Path (Join-Path $Tenant.WorkspacePath '.env.example') -Content $envLines
    Write-TextFile -Path (Join-Path $Tenant.WorkspacePath $Tenant.SecretFileName) -Content $secretLines
    Write-TextFile -Path (Join-Path $Tenant.WorkspacePath 'index.html') -Content $indexHtml
    Write-TextFile -Path (Join-Path $Tenant.WorkspacePath 'vite.config.js') -Content $viteConfig
    Write-TextFile -Path (Join-Path $Tenant.WorkspacePath 'vitest.config.mjs') -Content $vitestConfig
    Write-TextFile -Path (Join-Path $Tenant.WorkspacePath 'eslint.config.js') -Content $eslintConfig
    Write-TextFile -Path (Join-Path $Tenant.WorkspacePath 'src/main.jsx') -Content $mainJs
    Write-TextFile -Path (Join-Path $Tenant.WorkspacePath 'src/App.jsx') -Content $appJs
    Write-TextFile -Path (Join-Path $Tenant.WorkspacePath 'src/index.css') -Content $css
    Write-TextFile -Path (Join-Path $Tenant.WorkspacePath 'src/tenantPlan.js') -Content $tenantPlan

    $gitkeepPath = Join-Path $Tenant.WorkspacePath 'public/.gitkeep'
    if ($script:PSCmdlet.ShouldProcess($gitkeepPath, 'Create placeholder asset directory file')) {
        [System.IO.File]::WriteAllText($gitkeepPath, '', $script:Utf8NoBomEncoding)
    }
}


$repoRoot = $null
if ($PSBoundParameters.ContainsKey('RepoRoot')) {
    if (-not (Test-Path -Path $RepoRoot -PathType Container)) {
        throw "Provided RepoRoot '$RepoRoot' does not exist or is not a directory."
    }

    $repoRoot = (Resolve-Path -Path $RepoRoot).ProviderPath
}
else {
    $repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
}

$repoRoot = $repoRoot.TrimEnd([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar)

if (-not (Test-Path -Path $repoRoot -PathType Container)) {
    throw "Resolved repository root '$repoRoot' does not exist or is not a directory."
}
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

$workspaceSlug = Get-TenantSlug -Domain $Domain
$scriptSlug = $workspaceSlug
$packageName = "websites-$workspaceSlug"
$secretName = Get-TenantSecretName -Domain $Domain
$secretFileName = Get-SecretFileName -Domain $Domain
$supportEmail = "support@$Domain"

$tenant = [pscustomobject]@{
    Domain = $Domain
    DisplayName = $normalizedDisplayName
    DistributionId = $DistributionId
    WorkspacePath = $tenantWorkspacePath
    WorkspaceSlug = $workspaceSlug
    ScriptSlug = $scriptSlug
    PackageName = $packageName
    SecretFileName = $secretFileName
    SecretName = $secretName
    SupportEmail = $supportEmail
}

$result = [ordered]@{
    Domain = $Domain
    DisplayName = $normalizedDisplayName
    DistributionId = $DistributionId
    EnvSecretKeys = $normalizedSecretKeys
    WorkspaceSlug = $workspaceSlug
    WorkspacePackage = $packageName
    ScriptSlug = $scriptSlug
    WorkspacePath = $tenantWorkspacePath
    SecretFileName = $secretFileName
    SecretName = $secretName
    ValidateOnly = [bool]$ValidateOnly
    Scaffolded = $false
}

if ($ValidateOnly) {
    Write-Output ([pscustomobject]$result)
    return
}

New-TenantWorkspace -Tenant $tenant -EnvSecretKeys $normalizedSecretKeys
Update-RootPackageJson -RepoRoot $repoRoot -Tenant $tenant
Update-CfDistributionsFile -RepoRoot $repoRoot -Tenant $tenant
Update-WebsitesReadme -RepoRoot $repoRoot -Tenant $tenant
Update-SyncSitesScript -RepoRoot $repoRoot -Tenant $tenant
Update-CloudFrontConfig -RepoRoot $repoRoot -Tenant $tenant
Update-S3Config -RepoRoot $repoRoot -Tenant $tenant
Update-TenantManifest -RepoRoot $repoRoot -Tenant $tenant -EnvSecretKeys $normalizedSecretKeys

$result['Scaffolded'] = $true
Write-Output ([pscustomobject]$result)
