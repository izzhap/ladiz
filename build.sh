#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

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
