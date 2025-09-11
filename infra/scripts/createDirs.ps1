# Base path
$base = 'J:\Home\Projects\Development\Sources\guidogerb-website'

# Folders to add
$dirs = @(
  # Pure CloudFormation starters (place the YAMLs here)
  'infra\cfn\stream4cloud',
  'infra\cfn\stream4cloud\edge-site',
  'infra\cfn\stream4cloud\auth',
  'infra\cfn\stream4cloud\api',
  'infra\cfn\stream4cloud\data',
  'infra\cfn\stream4cloud\media',
  'infra\cfn\stream4cloud\search',

  # Cross-cutting scripts & CI
  'infra\scripts',
  '.github\workflows',

  # Normalize the other three websites to match store.com’s structure
  'websites\garygerber.com\public',
  'websites\garygerber.com\src',
  'websites\garygerber.com\src\assets',
  'websites\garygerber.com\src\website-components',
  'websites\garygerber.com\src\website-components\welcome-page',

  'websites\picklecheeze.com\public',
  'websites\picklecheeze.com\src',
  'websites\picklecheeze.com\src\assets',
  'websites\picklecheeze.com\src\website-components',
  'websites\picklecheeze.com\src\website-components\welcome-page',

  'websites\this-is-my-story.org\public',
  'websites\this-is-my-story.org\src',
  'websites\this-is-my-story.org\src\assets',
  'websites\this-is-my-story.org\src\website-components',
  'websites\this-is-my-story.org\src\website-components\welcome-page'
)

# Create them (idempotent)
$dirs | ForEach-Object {
  $p = Join-Path $base $_
  New-Item -ItemType Directory -Force -Path $p | Out-Null
  Write-Host "Ensured: $p"
}
