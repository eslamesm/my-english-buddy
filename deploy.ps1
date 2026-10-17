# نشر English Kids على Vercel (production)
# الاستخدام: كليك يمين > Run with PowerShell، أو:  powershell -ExecutionPolicy Bypass -File deploy.ps1
# ملاحظة: كاش npm على D: لأن قرص C: ممتلئ.

$env:npm_config_cache = 'D:\npm-cache'
$env:TEMP = 'D:\tmp'
$env:TMP  = 'D:\tmp'
New-Item -ItemType Directory -Force -Path 'D:\npm-cache','D:\tmp' | Out-Null

Write-Host "النشر جارٍ على Vercel..." -ForegroundColor Cyan
npx --yes vercel@latest deploy --prod --yes --archive=tgz

Write-Host ""
Write-Host "الرابط العام: https://english-kids-ik.vercel.app" -ForegroundColor Green
