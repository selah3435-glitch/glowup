# Deploy static + glo-chat function (avoids TanStack .netlify/v1 EISDIR).
# Usage:
#   npm run build
#   node E:\GlowUP-build\generate-html.mjs
#   powershell -File scripts\deploy-netlify-with-functions.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

if (-not (Test-Path "dist\client\index.html")) {
  throw "Missing dist/client/index.html - run build + generate-html first"
}

$src = (Resolve-Path "dist\client").Path
@"
/api/glo/chat  /.netlify/functions/glo-chat  200
/api/glo/desk  /.netlify/functions/glo-desk  200
/api/platform  /.netlify/functions/platform  200
/api/health  /.netlify/functions/health  200
/api/billing/checkout  /.netlify/functions/create-checkout  200
/api/sms  /.netlify/functions/send-sms  200
/api/email  /.netlify/functions/send-email  200
/api/ops  /.netlify/functions/ops  200
/api/agents/copywriter  /.netlify/functions/copywriter  200
/api/agents/company-prospect  /.netlify/functions/company-prospect  200
/api/agents/competitor-hunt  /.netlify/functions/competitor-hunt  200
/api/onboarding  /.netlify/functions/onboarding  200
/*    /index.html   200
"@ | Set-Content "$src\_redirects" -Encoding ASCII

if (Test-Path "public") {
  Copy-Item "public\*" $src -Force -ErrorAction SilentlyContinue
}

$renamed = $false
if (Test-Path ".netlify") {
  Rename-Item ".netlify" ".netlify.bak-deploy" -Force
  $renamed = $true
}

try {
  npx --yes netlify-cli@17 deploy --prod --dir=dist/client --functions=netlify/functions-clean --site=f73e88c5-30bb-4291-8905-c203fbaecaba --skip-functions-cache
  if ($LASTEXITCODE -ne 0) { throw "netlify deploy failed with code $LASTEXITCODE" }
  Write-Host "Production: https://glowupbeautysolutions-260.netlify.app"
  Write-Host "Set XAI_API_KEY in Netlify env for live Glo chat."
}
finally {
  if ($renamed -and (Test-Path ".netlify.bak-deploy")) {
    if (Test-Path ".netlify") {
      Remove-Item ".netlify" -Recurse -Force -ErrorAction SilentlyContinue
    }
    Rename-Item ".netlify.bak-deploy" ".netlify" -Force
  }
}
