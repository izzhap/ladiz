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
    node -e "const fs = require('fs'); const file = './src/package.json'; let c = fs.readFileSync(file, 'utf8'); let updated = false; c = c.replace(/\"version\":\s*\"(\d+)\.(\d+)\.(\d+)\"/, (_, maj, min, pat) => { updated = true; const next = maj + '.' + min + '.' + (Number(pat) + 1); console.log('[VERSION] Versi diperbarui: ' + maj + '.' + min + '.' + pat + ' -> ' + next); return '\"version\": \"' + next + '\"'; }); if (!updated) { console.error('Versi tidak ditemukan'); process.exit(1); }; fs.writeFileSync(file, c, 'utf8');"
else
    echo "[VERSION] Patch versi dilewati (menggunakan versi saat ini)."
fi

echo "[BUILD] Memulai build Ladiz Extension..."

if command -v pnpm >/dev/null 2>&1; then
    pnpm vsix
else
    npm run vsix
fi

BIN_PATH="$DIR/bin"
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
