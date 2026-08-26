# Deploy dist/client to Netlify via API with POSIX zip paths (Windows-safe).
# Usage (from glowkiss-main):
#   npm run build
#   node E:\GlowUP-build\generate-html.mjs
#   powershell -File scripts\deploy-netlify-api.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

$sourceDir = (Resolve-Path "dist\client").Path
$zipPath = "E:\GlowUP-build\glowup-deploy.zip"
$site = "f73e88c5-30bb-4291-8905-c203fbaecaba"

if (-not (Test-Path "$sourceDir\index.html")) {
  throw "Missing dist/client/index.html - run build + generate-html first"
}

# Keep API → function rewrites. Static zip deploys do NOT upload functions —
# after this script, also run CLI deploy with --functions=netlify/functions-clean
# (or npm run deploy:full) or APIs 404 as HTML and break res.json().
@"
/api/glo/chat  /.netlify/functions/glo-chat  200
/api/glo/desk  /.netlify/functions/glo-desk  200
/api/platform  /.netlify/functions/platform  200
/api/health  /.netlify/functions/health  200
/api/billing/checkout  /.netlify/functions/create-checkout  200
/api/sms  /.netlify/functions/send-sms  200
/api/ops  /.netlify/functions/ops  200
/api/agents/copywriter  /.netlify/functions/copywriter  200
/api/agents/company-prospect  /.netlify/functions/company-prospect  200
/api/email  /.netlify/functions/send-email  200
/*    /index.html   200
"@ | Set-Content "$sourceDir\_redirects" -Encoding ASCII
if (Test-Path "public") { Copy-Item "public\*" $sourceDir -Force -ErrorAction SilentlyContinue }

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, "Create")
Get-ChildItem $sourceDir -Recurse -File | ForEach-Object {
  $rel = $_.FullName.Substring($sourceDir.Length).TrimStart("\", "/").Replace("\", "/")
  [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
    $zip, $_.FullName, $rel, [System.IO.Compression.CompressionLevel]::Optimal)
}
$zip.Dispose()
$zipBytes = (Get-Item $zipPath).Length
Write-Host "ZIP $zipPath ($zipBytes bytes)"

$cfg = Get-Content "$env:APPDATA\netlify\Config\config.json" -Raw | ConvertFrom-Json
$token = $cfg.users.'6a6bddee8b3f8ed9b8ce2f4e'.auth.token
if (-not $token) { throw "No Netlify auth token in AppData config" }

$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/zip" }
$resp = Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/sites/$site/deploys" `
  -Method Post -Headers $headers -InFile $zipPath -TimeoutSec 300
Write-Host "DEPLOY $($resp.id) state=$($resp.state)"

for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 2
  $d = Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/sites/$site/deploys/$($resp.id)" `
    -Headers @{ Authorization = "Bearer $token" }
  Write-Host "  poll $($d.state)"
  if ($d.state -eq "ready" -or $d.state -eq "error") { break }
}

Write-Host "Production: https://glowupbeautysolutions-260.netlify.app"
