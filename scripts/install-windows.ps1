param(
  [switch]$SkipOpenCode
)

$ErrorActionPreference = "Stop"
$AppDir = Resolve-Path (Join-Path $PSScriptRoot "..")

function Test-Node20 {
  $node = Get-Command node -ErrorAction SilentlyContinue
  if (-not $node) {
    return $false
  }

  $major = node -p "Number(process.versions.node.split('.')[0])"
  return [int]$major -ge 20
}

Write-Host "Installing OpenForge from $AppDir"

if (-not (Test-Node20)) {
  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if (-not $winget) {
    throw "Node.js 20+ is required. Install it from https://nodejs.org/ or install winget and run this script again."
  }

  Write-Host "Installing Node.js LTS with winget..."
  winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
}

Write-Host "Node: $(node --version)"
Write-Host "npm: $(npm --version)"

Set-Location $AppDir
npm install

if (-not $SkipOpenCode) {
  $opencode = Get-Command opencode -ErrorAction SilentlyContinue
  if ($opencode) {
    Write-Host "OpenCode already installed: $($opencode.Source)"
  } else {
    Write-Host "Installing OpenCode with npm..."
    npm install -g opencode-ai
  }
}

Write-Host ""
Write-Host "OpenForge is installed."
Write-Host "Start it with:"
Write-Host "  npm start"
