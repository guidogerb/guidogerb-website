# PowerShell script to destroy Terraform resources for a specific environment

param (
    [Parameter(Mandatory = $true)]
    [ValidateSet("dev", "prod")]
    [string]$Environment
)

$ErrorActionPreference = "Stop"

Write-Host "Preparing to destroy Terraform resources for $Environment environment..." -ForegroundColor Red

# Set the working directory to the environment folder
$WorkingDir = Join-Path -Path "$PSScriptRoot\.." -ChildPath "environments\$Environment"
Set-Location -Path $WorkingDir

# Prompt for confirmation multiple times before destroying production
if ($Environment -eq "prod") {
    Write-Host "WARNING: You are about to DESTROY ALL RESOURCES in the PRODUCTION environment." -ForegroundColor Red -BackgroundColor Yellow
    Write-Host "This action is IRREVERSIBLE and will result in DATA LOSS." -ForegroundColor Red
    
    $confirmation1 = Read-Host "Are you absolutely sure you want to proceed? Type 'yes' to confirm"
    if ($confirmation1 -ne "yes") {
        Write-Host "Destroy operation cancelled." -ForegroundColor Yellow
        exit 0
    }
    
    $confirmation2 = Read-Host "Please confirm once more by typing the environment name 'prod'"
    if ($confirmation2 -ne "prod") {
        Write-Host "Destroy operation cancelled." -ForegroundColor Yellow
        exit 0
    }
}
else {
    $confirmation = Read-Host "You are about to destroy all resources in the $Environment environment. Are you sure? Type 'yes' to confirm"
    if ($confirmation -ne "yes") {
        Write-Host "Destroy operation cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Run Terraform destroy
terraform destroy

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error destroying Terraform resources. Check the error messages above." -ForegroundColor Red
    exit 1
}

Write-Host "Terraform resources destroyed successfully for $Environment environment." -ForegroundColor Green
