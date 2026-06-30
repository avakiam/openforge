param(
  [switch]$SkipOpenCode
)

$ErrorActionPreference = "Stop"
$AppDir = Resolve-Path (Join-Path $PSScriptRoot "..")

Set-Location $AppDir

if (-not (Test-Path ".git")) {
  throw "This directory is not a git clone: $AppDir"
}

Write-Host "Updating OpenForge in $AppDir"
git fetch --prune
git pull --ff-only
npm install

if (-not $SkipOpenCode) {
  $opencode = Get-Command opencode -ErrorAction SilentlyContinue
  if ($opencode) {
    Write-Host "Updating OpenCode with npm..."
  } else {
    Write-Host "OpenCode is not installed yet. Installing with npm..."
  }
  npm install -g opencode-ai
}

Write-Host ""
Write-Host "Update complete."
Write-Host "Restart OpenForge if it is currently running, then start it with:"
Write-Host "  npm start"
