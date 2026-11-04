[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet("yes", "no", "y", "n")]
    [string]$PatchVersion
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

if ([string]::IsNullOrWhiteSpace($PatchVersion)) {
    $title = "Konfirmasi Patch Versi"
    $message = "Apakah ingin melakukan patch versi sebelum build?"
    $choices = @(
        [System.Management.Automation.Host.ChoiceDescription]::new("&Yes", "Patch versi di src/package.json sebelum build."),
        [System.Management.Automation.Host.ChoiceDescription]::new("&No", "Build langsung tanpa mengubah versi saat ini.")
    )
    $result = $Host.UI.PromptForChoice($title, $message, $choices, 1)
    $shouldPatch = ($result -eq 0)
} else {
    $shouldPatch = ($PatchVersion.ToLower() -in @("yes", "y"))
}

if ($shouldPatch) {
    Write-Host "[VERSION] Melakukan patch versi di src/package.json..." -ForegroundColor Yellow
    node -e "const fs = require('fs'); const file = './src/package.json'; let c = fs.readFileSync(file, 'utf8'); let updated = false; c = c.replace(/\"version\":\s*\"(\d+)\.(\d+)\.(\d+)\"/, (_, maj, min, pat) => { updated = true; const next = maj + '.' + min + '.' + (Number(pat) + 1); console.log('[VERSION] Versi diperbarui: ' + maj + '.' + min + '.' + pat + ' -> ' + next); return '\"version\": \"' + next + '\"'; }); if (!updated) { console.error('Versi tidak ditemukan'); process.exit(1); }; fs.writeFileSync(file, c, 'utf8');"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "[ERROR] Gagal patch versi."
        exit $LASTEXITCODE
    }
} else {
    Write-Host "[VERSION] Patch versi dilewati (menggunakan versi saat ini)." -ForegroundColor Gray
}

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
