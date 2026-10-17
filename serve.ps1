# English Kids - محلي سيرفر (يحتاج Python أو http-server)
# الأسهل: استخدم Python المثبت على الجهاز
param([int]$Port = 8080)

Write-Host "Starting local server on port $Port ..." -ForegroundColor Cyan
$root = $PSScriptRoot
Push-Location $root

$py = Get-Command python -ErrorAction SilentlyContinue
if ($py) {
  Write-Host "Open on this PC:      http://localhost:$Port/" -ForegroundColor Green
  Write-Host "Open on phone (same Wi-Fi): http://<IP-of-PC>:$Port/" -ForegroundColor Green
  if (Test-Path (Join-Path $PSScriptRoot 'serve.py')) {
    python (Join-Path $PSScriptRoot 'serve.py') $Port
  } else {
    python -m http.server $Port
  }
  Pop-Location
  return
}

$npx = Get-Command npx -ErrorAction SilentlyContinue
if ($npx) {
  npx --yes http-server -p $Port
  Pop-Location
  return
}

Write-Host "Python or Node.js is required. Install Python from python.org then run again." -ForegroundColor Yellow
Pop-Location
