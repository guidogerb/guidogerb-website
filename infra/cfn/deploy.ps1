param(
  [ValidateSet('DeployEdgeAll','DeleteEdgeAll','DeployAuth','DeleteAuth','GenerateApiParams','DeployApi','DeleteApi','DeployData','DeleteData','DeployMedia','DeleteMedia','DeploySearch','DeleteSearch','DeployAll')]
  [string]$Action = 'DeployAll',
  [string]$Region = 'us-east-1',
  [string]$Profile = ''
)

function Invoke-CFN {
  param([string]$TemplateFile,[string]$StackName,[string]$ParamsFile,[string[]]$Capabilities=@())
  $cap = $Capabilities | ForEach-Object { "--capabilities $_" } | Out-String
  $cap = $cap -replace '\s+$',''
  $profileArg = $Profile -ne '' ? "--profile $Profile" : ''
  $cmd = "aws cloudformation deploy --template-file `"$TemplateFile`" --stack-name $StackName --parameter-overrides file://$ParamsFile --region $Region $cap $profileArg"
  Write-Host ">>> $cmd" -ForegroundColor Cyan
  iex $cmd
}
function Remove-CFN { param([string]$StackName)
  $profileArg = $Profile -ne '' ? "--profile $Profile" : ''
  $cmd = "aws cloudformation delete-stack --stack-name $StackName --region $Region $profileArg"
  Write-Host ">>> $cmd" -ForegroundColor Yellow
  iex $cmd
  Write-Host "Waiting for stack delete: $StackName ..."
  $wait = "aws cloudformation wait stack-delete-complete --stack-name $StackName --region $Region $profileArg"
  iex $wait
}

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

$domains = @('garygerber.com','ggp-store.com','picklecheeze.com','this-is-my-story.org')
function StackName-Edge($domain){ return ('s4c-edge-' + $domain -replace '\.','-') }

function Deploy-EdgeAll {
  foreach ($d in $domains) {
    Invoke-CFN -TemplateFile "edge-site.yaml" -StackName (StackName-Edge $d) -ParamsFile ("params/edge-" + $d + ".json") -Capabilities @('CAPABILITY_NAMED_IAM')
  }
}
function Delete-EdgeAll { foreach ($d in $domains) { Remove-CFN -StackName (StackName-Edge $d) } }

function Deploy-Auth { Invoke-CFN -TemplateFile "auth.yaml" -StackName "s4c-auth" -ParamsFile "params/auth.json" -Capabilities @('CAPABILITY_NAMED_IAM','CAPABILITY_AUTO_EXPAND') }
function Delete-Auth { Remove-CFN -StackName "s4c-auth" }

function Generate-ApiParams {
  $profileArg = $Profile -ne '' ? "--profile $Profile" : ''
  $json = iex "aws cloudformation describe-stacks --stack-name s4c-auth --region $Region $profileArg"
  if (-not $json) { throw "Unable to describe s4c-auth" }
  $obj = $json | ConvertFrom-Json
  $outs = @{}; foreach ($o in $obj.Stacks[0].Outputs) { $outs[$o.OutputKey] = $o.OutputValue }
  $issuer = $outs['HostedUIIssuer']
  $clientId = $outs['UserPoolClientId']
  if (-not $issuer -or -not $clientId) { throw "Auth outputs missing. Found Issuer=$issuer ClientId=$clientId" }
  $apiParams = @{
    Parameters = @{
      ApiName = "stream4cloud-api"
      StageName = "prod"
      CognitoIssuerUrl = $issuer
      CognitoAudienceClientIds = "[`"$clientId`"]"
    }
  } | ConvertTo-Json -Depth 6
  $apiParams | Set-Content -Path "params/api.json" -Encoding UTF8
  Write-Host "Wrote params/api.json"
}

function Deploy-Api { Invoke-CFN -TemplateFile "api.yaml" -StackName "s4c-api" -ParamsFile "params/api.json" -Capabilities @('CAPABILITY_NAMED_IAM') }
function Delete-Api { Remove-CFN -StackName "s4c-api" }

function Deploy-Data { Invoke-CFN -TemplateFile "data.yaml" -StackName "s4c-data" -ParamsFile "params/data.json" }
function Delete-Data { Remove-CFN -StackName "s4c-data" }

function Deploy-Media { Invoke-CFN -TemplateFile "media-audio-video.yaml" -StackName "s4c-media" -ParamsFile "params/media.json" -Capabilities @('CAPABILITY_NAMED_IAM') }
function Delete-Media { Remove-CFN -StackName "s4c-media" }

function Deploy-Search { Invoke-CFN -TemplateFile "opensearch-serverless.yaml" -StackName "s4c-oss" -ParamsFile "params/opensearch.json" }
function Delete-Search { Remove-CFN -StackName "s4c-oss" }

function Deploy-All { Deploy-EdgeAll; Deploy-Auth; Generate-ApiParams; Deploy-Api; Deploy-Data; Deploy-Media; Deploy-Search }

switch ($Action) {
  'DeployEdgeAll' { Deploy-EdgeAll }
  'DeleteEdgeAll' { Delete-EdgeAll }
  'DeployAuth' { Deploy-Auth }
  'DeleteAuth' { Delete-Auth }
  'GenerateApiParams' { Generate-ApiParams }
  'DeployApi' { Deploy-Api }
  'DeleteApi' { Delete-Api }
  'DeployData' { Deploy-Data }
  'DeleteData' { Delete-Data }
  'DeployMedia' { Deploy-Media }
  'DeleteMedia' { Delete-Media }
  'DeploySearch' { Deploy-Search }
  'DeleteSearch' { Delete-Search }
  'DeployAll' { Deploy-All }
}
