# Meydone: Mongo (Docker) + backend + frontend
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "=== MongoDB (Docker) ===" -ForegroundColor Cyan
try {
  Set-Location "$root\backend"
  docker compose up -d mongo 2>$null
  if ($LASTEXITCODE -eq 0) { Write-Host "mongo container OK" -ForegroundColor Green }
} catch {
  Write-Host "Docker yok veya mongo baslamadi — yerel MongoDB'nizin acik oldugundan emin olun." -ForegroundColor Yellow
}
Set-Location $root

if (-not (Test-Path "$root\frontend\node_modules")) {
  Write-Host "=== npm install (frontend) ===" -ForegroundColor Cyan
  Set-Location "$root\frontend"
  npm install
  Set-Location $root
}

Write-Host "=== Backend :4000 ve Frontend :5173 ayri pencerelerde aciliyor ===" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$root\backend`"; npm run dev"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$root\frontend`"; npm run dev"
Start-Sleep -Seconds 3
Start-Process "http://127.0.0.1:5173"
Write-Host "Tarayici acildi: http://127.0.0.1:5173" -ForegroundColor Green
