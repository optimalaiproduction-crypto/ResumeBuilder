$env:JWT_SECRET_KEY = "dev-secret"
$env:DEBUG = "true"
$env:FRONTEND_URL = "http://localhost:3000,http://127.0.0.1:3000"
$apiRoot = "C:\Users\Admin\OneDrive\Desktop\resume buillder\apps\api"
$envFile = Join-Path $apiRoot ".env"

if (-not $env:DATABASE_URL -or [string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
  if (Test-Path $envFile) {
    $dbLine = Get-Content $envFile | Where-Object { $_ -match "^\s*DATABASE_URL\s*=" } | Select-Object -First 1
    if ($dbLine) {
      $parsed = ($dbLine -replace "^\s*DATABASE_URL\s*=", "").Trim().Trim('"').Trim("'")
      if (-not [string]::IsNullOrWhiteSpace($parsed)) {
        $env:DATABASE_URL = $parsed
        Write-Host "DATABASE_URL loaded from apps/api/.env"
      }
    }
  }

  if (-not $env:DATABASE_URL -or [string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
    $env:DATABASE_URL = "sqlite+pysqlite:///./dev_resumeforge.db"
    Write-Host "DATABASE_URL not set. Using local SQLite: $($env:DATABASE_URL)"
  }
} else {
  Write-Host "Using DATABASE_URL from environment."
}

Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object {
    Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
  }

Set-Location $apiRoot
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
