# PowerShell script to initialize Terraform for a specific environment

param (
    [Parameter(Mandatory = $true)]
    [ValidateSet("dev", "prod")]
    [string]$Environment
)

$ErrorActionPreference = "Stop"

Write-Host "Initializing Terraform for $Environment environment..." -ForegroundColor Green

# Set the working directory to the environment folder
$WorkingDir = Join-Path -Path "$PSScriptRoot\.." -ChildPath "environments\$Environment"
Set-Location -Path $WorkingDir

# Run Terraform init
terraform init

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error initializing Terraform. Check the error messages above." -ForegroundColor Red
    exit 1
}

Write-Host "Terraform initialization completed successfully for $Environment environment." -ForegroundColor Green
