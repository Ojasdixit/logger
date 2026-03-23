# ──────────────────────────────────────────────────────────────────────
#  Employee Monitor Agent — Windows Installer (PowerShell)
#  Run with:
#    $env:EMPLOYEE_ID="..."; $env:API_URL="..."; $env:API_KEY="..."; irm https://logger-1-u9b8.onrender.com/installers/install-windows.ps1 | iex
# ──────────────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"
$InstallDir = "$env:LOCALAPPDATA\EmployeeMonitorAgent"
$GithubRepo = "https://github.com/Ojasdixit/logger"

# ── Read env vars ──────────────────────────────────────────────────────
$EmployeeId = $env:EMPLOYEE_ID
$ApiUrl     = if ($env:API_URL) { $env:API_URL } else { "https://logger-lhu8.onrender.com/api" }
$ApiKey     = if ($env:API_KEY) { $env:API_KEY } else { "agent-secret-key-2026" }

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  Employee Monitor Agent - Windows Installer" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# ── Check Node.js ──────────────────────────────────────────────────────
try {
    $nodeVersion = node -v
    Write-Host "[OK] Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "[!] Node.js not found. Please install from https://nodejs.org" -ForegroundColor Red
    Write-Host "    Download the LTS version, install it, then re-run this script." -ForegroundColor Yellow
    exit 1
}

# ── Download agent from GitHub ─────────────────────────────────────────
if (Test-Path $InstallDir) {
    Write-Host "[!] Existing installation found. Removing..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $InstallDir
}

Write-Host "Downloading agent from GitHub..."
$TempZip     = "$env:TEMP\logger-agent.zip"
$TempExtract = "$env:TEMP\logger-agent-extract"

Invoke-WebRequest -Uri "$GithubRepo/archive/refs/heads/main.zip" -OutFile $TempZip
if (Test-Path $TempExtract) { Remove-Item -Recurse -Force $TempExtract }
Expand-Archive -Path $TempZip -DestinationPath $TempExtract -Force

New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
Copy-Item -Recurse "$TempExtract\logger-main\agent\*" $InstallDir

Remove-Item $TempZip
Remove-Item -Recurse -Force $TempExtract

# ── Install dependencies ───────────────────────────────────────────────
Write-Host "Installing dependencies..."
Push-Location $InstallDir
npm install --production --silent 2>&1 | Select-Object -Last 1
Pop-Location

Write-Host "[OK] Agent installed at $InstallDir" -ForegroundColor Green

# ── Run setup wizard ───────────────────────────────────────────────────
Write-Host ""
Write-Host "--- Configuring agent ---"
Write-Host ""

$env:EMPLOYEE_ID = $EmployeeId
$env:API_URL      = $ApiUrl
$env:API_KEY      = $ApiKey
$env:AUTO_START   = "y"

Push-Location $InstallDir
node src\setup.js
Pop-Location

Write-Host ""
Write-Host "[OK] Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "  Agent location: $InstallDir"
Write-Host "  Start manually: cd $InstallDir; npm start"
Write-Host "  View logs:      Get-Content $InstallDir\agent.log"
Write-Host "  Uninstall:      cd $InstallDir; npm run uninstall-service; Remove-Item -Recurse $InstallDir"
Write-Host ""
