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
    npm --prefix src version patch --no-git-tag-version
    if ($LASTEXITCODE -ne 0) {
        Write-Error "[ERROR] Gagal patch versi."
        exit $LASTEXITCODE
    }
} else {
    Write-Host "[VERSION] Patch versi dilewati (menggunakan versi saat ini)." -ForegroundColor Gray
}

Write-Host "[BUILD] Memulai build Ladiz Extension..." -ForegroundColor Cyan

if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    pnpm build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "[ERROR] Build packages gagal."
        exit $LASTEXITCODE
    }
    pnpm vsix
} else {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "[ERROR] Build packages gagal."
        exit $LASTEXITCODE
    }
    npm run vsix
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "[ERROR] Build vsix gagal."
    exit $LASTEXITCODE
}

$binPath = Join-Path $scriptDir "bin"
$packageJsonPath = Join-Path $scriptDir "src/package.json"
$targetVsix = $null

if (Test-Path $packageJsonPath) {
    $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    $expectedPath = Join-Path $binPath "ladiz-$($packageJson.version).vsix"
    if (Test-Path $expectedPath) {
        $targetVsix = Get-Item $expectedPath
    }
}

if (-not $targetVsix) {
    $targetVsix = Get-ChildItem -Path $binPath -Filter "*.vsix" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
}

if ($targetVsix) {
    Write-Host "[INSTALL] Menginstall $($targetVsix.Name) ke Antigravity IDE..." -ForegroundColor Cyan
    $antigravityCmd = $null
    if (Get-Command antigravity-ide -ErrorAction SilentlyContinue) {
        $antigravityCmd = "antigravity-ide"
    } elseif (Get-Command antigravity -ErrorAction SilentlyContinue) {
        $antigravityCmd = "antigravity"
    }

    if ($antigravityCmd) {
        & $antigravityCmd --install-extension $targetVsix.FullName --force
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[SUCCESS] Berhasil install $($targetVsix.Name) ke Antigravity IDE!" -ForegroundColor Green
        } else {
            Write-Warning "[WARN] Gagal install ekstensi ke Antigravity IDE."
        }
    } else {
        Write-Warning "[WARN] Perintah antigravity-ide atau antigravity tidak ditemukan di PATH."
    }
}

Write-Host "[SUCCESS] Build selesai! Membuka folder output di Explorer..." -ForegroundColor Green

if (Test-Path $binPath) {
    Invoke-Item $binPath
} else {
    Invoke-Item $scriptDir
}
