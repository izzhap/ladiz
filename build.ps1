$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "[BUILD] Memulai build Ladiz Extension..." -ForegroundColor Cyan

if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    pnpm vsix
} else {
    npm run vsix
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "[ERROR] Build gagal."
    exit $LASTEXITCODE
}

$binPath = Join-Path $scriptDir "bin"
Write-Host "[SUCCESS] Build selesai! Membuka folder output di Explorer..." -ForegroundColor Green

if (Test-Path $binPath) {
    Invoke-Item $binPath
} else {
    Invoke-Item $scriptDir
}
