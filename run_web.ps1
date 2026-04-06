$env:Path = "C:\Program Files\nodejs;" + $env:Path
$projectRoot = "C:\Users\Admin\OneDrive\Desktop\resume buillder"
$env:NEXT_TELEMETRY_DISABLED = "1"

Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object {
    Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
  }

$nextCache = Join-Path $projectRoot "apps\web\.next"
if (Test-Path $nextCache) {
  Remove-Item $nextCache -Recurse -Force -ErrorAction SilentlyContinue
}

Set-Location $projectRoot
& "C:\Program Files\nodejs\npm.cmd" run build:web
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

& "C:\Program Files\nodejs\npm.cmd" run start:web
