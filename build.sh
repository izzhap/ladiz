#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

SHOULD_PATCH=false

if [ -n "$1" ]; then
    PARAM="$(echo "$1" | tr '[:upper:]' '[:lower:]')"
    case "$PARAM" in
        yes|y)
            SHOULD_PATCH=true
            ;;
        no|n)
            SHOULD_PATCH=false
            ;;
        *)
            echo "[ERROR] Pilihan tidak valid: '$1'"
            echo "Gunakan: yes atau no"
            exit 1
            ;;
    esac
else
    echo "Apakah ingin melakukan patch versi sebelum build?"
    PS3="Pilih opsi (1 atau 2): "
    options=("Yes (Patch versi)" "No (Tanpa patch versi)")
    select opt in "${options[@]}"; do
        case $REPLY in
            1)
                SHOULD_PATCH=true
                break
                ;;
            2)
                SHOULD_PATCH=false
                break
                ;;
            *)
                echo "Pilihan tidak valid. Ketik 1 untuk Yes atau 2 untuk No."
                ;;
        esac
    done
fi

if [ "$SHOULD_PATCH" = true ]; then
    echo "[VERSION] Melakukan patch versi di src/package.json..."
    npm --prefix src version patch --no-git-tag-version
else
    echo "[VERSION] Patch versi dilewati (menggunakan versi saat ini)."
fi

echo "[BUILD] Memulai build Ladiz Extension..."

if command -v pnpm >/dev/null 2>&1; then
    pnpm build
    pnpm vsix
else
    npm run build
    npm run vsix
fi

BIN_PATH="$DIR/bin"
PACKAGE_VERSION=$(node -p "require('./src/package.json').version" 2>/dev/null || true)
TARGET_VSIX="$BIN_PATH/ladiz-$PACKAGE_VERSION.vsix"

if [ -f "$TARGET_VSIX" ]; then
    LATEST_VSIX="$TARGET_VSIX"
else
    LATEST_VSIX=$(ls -1t "$BIN_PATH"/*.vsix 2>/dev/null | head -n 1 || true)
fi

if [ -n "$LATEST_VSIX" ] && [ -f "$LATEST_VSIX" ]; then
    echo "[INSTALL] Menginstall $(basename "$LATEST_VSIX") ke Antigravity IDE..."
    IDE_CMD=""
    if command -v antigravity-ide >/dev/null 2>&1; then
        IDE_CMD="antigravity-ide"
    elif command -v antigravity >/dev/null 2>&1; then
        IDE_CMD="antigravity"
    fi

    if [ -n "$IDE_CMD" ]; then
        INSTALL_PATH="$LATEST_VSIX"
        if command -v wslpath >/dev/null 2>&1; then
            INSTALL_PATH="$(wslpath -w "$LATEST_VSIX" 2>/dev/null || echo "$LATEST_VSIX")"
        elif command -v cygpath >/dev/null 2>&1; then
            INSTALL_PATH="$(cygpath -w "$LATEST_VSIX" 2>/dev/null || echo "$LATEST_VSIX")"
        fi
        "$IDE_CMD" --install-extension "$INSTALL_PATH" --force || echo "[WARN] Gagal install ekstensi ke Antigravity IDE."
    else
        echo "[WARN] Perintah antigravity-ide atau antigravity tidak ditemukan di PATH."
    fi
fi

echo "[SUCCESS] Build selesai! Membuka folder output..."

if [ -d "$BIN_PATH" ]; then
    TARGET="$BIN_PATH"
else
    TARGET="$DIR"
fi

if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$TARGET" 2>/dev/null || true
elif command -v explorer.exe >/dev/null 2>&1; then
    WIN_PATH="$(wslpath -w "$TARGET" 2>/dev/null || echo "$TARGET")"
    explorer.exe "$WIN_PATH" 2>/dev/null || true
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$TARGET" 2>/dev/null || true
elif command -v gio >/dev/null 2>&1; then
    gio open "$TARGET" 2>/dev/null || true
else
    echo "Folder output: $TARGET"
fi
