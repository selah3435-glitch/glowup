# Sets XAI_API_KEY on Netlify production from your local env (never logs the value).
# Usage:
#   $env:XAI_API_KEY = "xai-..."
#   powershell -File scripts\set-xai-netlify-env.ps1

$ErrorActionPreference = "Stop"
if (-not $env:XAI_API_KEY -or $env:XAI_API_KEY.Length -lt 10) {
  throw "Set `$env:XAI_API_KEY first (your xAI key)."
}

$site = "f73e88c5-30bb-4291-8905-c203fbaecaba"
$cfg = Get-Content "$env:APPDATA\netlify\Config\config.json" -Raw | ConvertFrom-Json
$token = $cfg.users.'6a6bddee8b3f8ed9b8ce2f4e'.auth.token
if (-not $token) { throw "No Netlify auth token" }

$headers = @{
  Authorization = "Bearer $token"
  "Content-Type" = "application/json"
}

# Account-scoped env API (Netlify v1)
$accountId = "6a6bddee8b3f8ed9b8ce2f4e"
$body = @(
  @{
    key    = "XAI_API_KEY"
    scopes = @("builds", "functions", "runtime", "post_processing")
    values = @(
      @{
        value   = $env:XAI_API_KEY
        context = "all"
      }
    )
  }
) | ConvertTo-Json -Depth 6

try {
  Invoke-RestMethod -Method POST `
    -Uri "https://api.netlify.com/api/v1/accounts/$accountId/env?site_id=$site" `
    -Headers $headers `
    -Body $body | Out-Null
  Write-Host "Created XAI_API_KEY on site $site"
} catch {
  # Update if already exists
  $upd = @{
    key    = "XAI_API_KEY"
    scopes = @("builds", "functions", "runtime", "post_processing")
    values = @(
      @{
        value   = $env:XAI_API_KEY
        context = "all"
      }
    )
  } | ConvertTo-Json -Depth 6
  Invoke-RestMethod -Method PUT `
    -Uri "https://api.netlify.com/api/v1/accounts/$accountId/env/XAI_API_KEY?site_id=$site" `
    -Headers $headers `
    -Body $upd | Out-Null
  Write-Host "Updated XAI_API_KEY on site $site"
}

Write-Host "Redeploying functions so runtime picks up the key..."
Set-Location $PSScriptRoot\..
if (-not (Test-Path "dist\client\index.html")) {
  Write-Host "No dist yet - run npm run build + generate-html first, then npm run deploy:full"
  exit 0
}

& powershell -NoProfile -File "$PSScriptRoot\deploy-netlify-with-functions.ps1"
Write-Host "Done. Test: POST /api/glo/chat on the live site."
