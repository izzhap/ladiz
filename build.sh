#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

if [ -z "$1" ]; then
    echo "[ERROR] Parameter wajib belum diisi!"
    echo "Penggunaan: $0 <patch_version: true|false|ya|tidak|1|0>"
    echo "Contoh:"
    echo "  $0 true    # Patch versi sebelum build (misal 3.53.8 -> 3.53.9)"
    echo "  $0 false   # Build tanpa mengubah versi"
    exit 1
fi

PARAM="$(echo "$1" | tr '[:upper:]' '[:lower:]')"
SHOULD_PATCH=false

case "$PARAM" in
    true|1|ya|y|yes)
        SHOULD_PATCH=true
        ;;
    false|0|tidak|t|no|n)
        SHOULD_PATCH=false
        ;;
    *)
        echo "[ERROR] Nilai parameter tidak valid: '$1'"
        echo "Gunakan salah satu: true, false, 1, 0, ya, tidak"
        exit 1
        ;;
esac

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
    open "$TARGET"
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$TARGET"
elif command -v gio >/dev/null 2>&1; then
    gio open "$TARGET"
else
    echo "Folder output: $TARGET"
fi
