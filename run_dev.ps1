$projectRoot = "C:\Users\Admin\OneDrive\Desktop\resume buillder"

Start-Process -FilePath powershell -ArgumentList @(
  "-NoExit",
  "-ExecutionPolicy", "Bypass",
  "-Command", "Set-Location '$projectRoot'; .\run_api.ps1"
)

Start-Process -FilePath powershell -ArgumentList @(
  "-NoExit",
  "-ExecutionPolicy", "Bypass",
  "-Command", "Set-Location '$projectRoot'; .\run_web.ps1"
)

Write-Host "Started API and Web in separate terminals."
Write-Host "API: http://127.0.0.1:8000/api/v1/health"
Write-Host "Web: http://localhost:3000"
