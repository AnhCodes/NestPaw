#!/usr/bin/env bash
# Render calm-tips card HTML at print resolution (3x = 3072x4608, ~768 DPI at 4x6).
set -euo pipefail

CHROME="${CHROME:-/Users/anh/Desktop/Workspace/Apps/Google Chrome.app/Contents/MacOS/Google Chrome}"
DIR="$(cd "$(dirname "$0")/../public/packaging" && pwd)"
SCALE="${SCALE:-3}"

render() {
  local name="$1"
  local html="file://${DIR}/${name}.html"
  local out="${DIR}/${name}.png"

  "$CHROME" \
    --headless=new \
    --disable-gpu \
    --hide-scrollbars \
    --force-device-scale-factor="$SCALE" \
    --window-size=1024,1536 \
    --default-background-color=fff7f8f6 \
    --screenshot="$out" \
    "$html"

  # 3072x4608 at 768 DPI is exactly 4x6 inches.
  sips -s dpiWidth 768 -s dpiHeight 768 "$out" >/dev/null
  sips -g pixelWidth -g pixelHeight -g dpiWidth -g dpiHeight "$out"
}

render "nestpaw-calm-tips-card"
render "nestpaw-calm-tips-card-back"
