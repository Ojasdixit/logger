# ──────────────────────────────────────────────────────────────────────
#  Employee Monitor Agent — Windows Installer (PowerShell)
#  Run with: irm https://your-server.com/install/windows | iex
# ──────────────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"
$InstallDir = "$env:LOCALAPPDATA\EmployeeMonitorAgent"

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  Employee Monitor Agent — Windows Installer" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# ── Check Node.js ─────────────────────────────────────────────────────
try {
    $nodeVersion = node -v
    Write-Host "[OK] Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "[!] Node.js not found. Please install from https://nodejs.org" -ForegroundColor Red
    Write-Host "    Download the LTS version, install it, then re-run this script." -ForegroundColor Yellow
    exit 1
}

# ── Download agent ────────────────────────────────────────────────────
if (Test-Path $InstallDir) {
    Write-Host "[!] Existing installation found. Removing..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $InstallDir
}

# Check for local source (dev mode)
$ScriptRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
if (Test-Path "$ScriptRoot\package.json") {
    Write-Host "  (Using local source from $ScriptRoot)"
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    Copy-Item -Recurse "$ScriptRoot\src" "$InstallDir\src"
    Copy-Item "$ScriptRoot\package.json" "$InstallDir\package.json"
    if (Test-Path "$ScriptRoot\config.json") {
        Copy-Item "$ScriptRoot\config.json" "$InstallDir\config.json"
    }
} else {
    Write-Host "Downloading agent..."
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    # In production, download from your server:
    # Invoke-WebRequest -Uri $env:AGENT_DOWNLOAD_URL -OutFile "$InstallDir\agent.zip"
    # Expand-Archive "$InstallDir\agent.zip" -DestinationPath $InstallDir -Force
    Write-Host "[!] No download URL configured. Copy agent files manually to $InstallDir" -ForegroundColor Yellow
}

# ── Install dependencies ──────────────────────────────────────────────
Write-Host "Installing dependencies..."
Push-Location $InstallDir
npm install --production --silent 2>&1 | Select-Object -Last 1
Pop-Location

Write-Host "[OK] Agent installed at $InstallDir" -ForegroundColor Green

# ── Run setup wizard ──────────────────────────────────────────────────
Write-Host ""
Write-Host "--- Running setup wizard ---"
Write-Host ""
Push-Location $InstallDir
node src\setup.js
Pop-Location

Write-Host ""
Write-Host "[OK] Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "  Agent location: $InstallDir"
Write-Host "  Start manually: cd $InstallDir; npm start"
Write-Host "  Uninstall:      cd $InstallDir; npm run uninstall-service; Remove-Item -Recurse $InstallDir"
Write-Host ""
