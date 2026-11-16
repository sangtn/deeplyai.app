#!/bin/bash
# Rebuilds src/data/lich/app-data.json from the Lịch Việt iOS source and verifies the web engine
# against the app for every day 1900–2100.
#   LICHVIET_IOS=~/Desktop/2025/LichViet_V1.2026.1 scripts/lich-data/run.sh
set -euo pipefail
IOS="${LICHVIET_IOS:?Set LICHVIET_IOS to the Lịch Việt iOS project folder}"
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT
SRC="$IOS/LichViet/VNLunar"
FLAGS=(-fobjc-arc -O2 -I"$SRC" -framework Foundation -framework UserNotifications -framework CoreGraphics)

clang "${FLAGS[@]}" "$HERE/dump.m" "$SRC/VNLunar.m" -o "$OUT/dump"
clang "${FLAGS[@]}" "$HERE/extra.m" "$SRC/VNLunar.m" -o "$OUT/extra"
"$OUT/dump" 1900 2100 > "$OUT/all.jsonl"
"$OUT/extra" > "$OUT/extra.json"

# 28 mansions: compile the app's Swift enum on its own and print it as JSON.
EXT="$IOS/LichViet/Extentions/Date+Extension.swift"
START=$(grep -n '^enum NhiThapBatTu' "$EXT" | cut -d: -f1)
END=$(awk -v s="$START" 'NR>s && /^}/ {print NR; exit}' "$EXT")
{ echo 'import Foundation'; sed -n "${START},${END}p" "$EXT"; cat <<'SWIFT'
let all: [NhiThapBatTu] = [.Giao, .Khang, .De, .Phong, .Tam, .Vi, .Khue, .Dau, .Nguu, .Nu, .Hu, .Nguy, .That, .Bich, .Khue2, .Lau, .Vi2, .Mao, .Tat, .Chuy, .Sam, .Tinh, .Quy, .Lieu, .Tinh2, .Truong, .Duc, .Chan]
let out = all.map { ["name": $0.tenDayDu, "nen": $0.nenLam, "kieng": $0.kiengCu, "ngoaiLe": $0.ngoaiLe, "tho": $0.tho] as [String: Any] }
FileHandle.standardOutput.write(try! JSONSerialization.data(withJSONObject: out, options: [.sortedKeys]))
SWIFT
} > "$OUT/stars.swift"
swiftc -O "$OUT/stars.swift" -o "$OUT/stars" && "$OUT/stars" > "$OUT/stars28.json"

(cd "$OUT" && python3 -I "$HERE/gen.py")
cd "$ROOT"
npx esbuild "$HERE/verify.mts" --bundle --platform=node --format=esm --outfile="$OUT/verify.mjs" --log-level=warning
node "$OUT/verify.mjs" "$OUT/all.jsonl"
