# PowerShell script to apply a Terraform plan for a specific environment

param (
    [Parameter(Mandatory = $true)]
    [ValidateSet("dev", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory = $false)]
    [string]$PlanFile = "tfplan"
)

$ErrorActionPreference = "Stop"

Write-Host "Applying Terraform plan for $Environment environment..." -ForegroundColor Green

# Set the working directory to the environment folder
$WorkingDir = Join-Path -Path "$PSScriptRoot\.." -ChildPath "environments\$Environment"
Set-Location -Path $WorkingDir

# Check if the plan file exists
if (-not (Test-Path $PlanFile)) {
    Write-Host "Plan file '$PlanFile' not found. Run plan.ps1 first to create a plan." -ForegroundColor Red
    exit 1
}

# Prompt for confirmation before applying changes to production
if ($Environment -eq "prod") {
    $confirmation = Read-Host "You are about to apply changes to the PRODUCTION environment. Are you sure? (y/n)"
    if ($confirmation -ne "y") {
        Write-Host "Deployment cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Run Terraform apply
terraform apply $PlanFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error applying Terraform plan. Check the error messages above." -ForegroundColor Red
    exit 1
}

Write-Host "Terraform plan applied successfully for $Environment environment." -ForegroundColor Green
