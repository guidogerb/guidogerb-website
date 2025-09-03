# PowerShell script to create a Terraform plan for a specific environment

param (
    [Parameter(Mandatory = $true)]
    [ValidateSet("dev", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory = $false)]
    [string]$OutFile = "tfplan"
)

$ErrorActionPreference = "Stop"

Write-Host "Creating Terraform plan for $Environment environment..." -ForegroundColor Green

# Set the working directory to the environment folder
$WorkingDir = Join-Path -Path "$PSScriptRoot\.." -ChildPath "environments\$Environment"
Set-Location -Path $WorkingDir

# Run Terraform plan
terraform plan -out=$OutFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error creating Terraform plan. Check the error messages above." -ForegroundColor Red
    exit 1
}

Write-Host "Terraform plan created successfully for $Environment environment." -ForegroundColor Green
Write-Host "To apply this plan, run: .\apply.ps1 -Environment $Environment -PlanFile $OutFile" -ForegroundColor Yellow
