#!/usr/bin/env bash
set -euo pipefail

# prepare-logos.sh
# Convert provided HD PNGs into app-ready logos and save them to apps/desktop/public.
#
# Usage:
#   scripts/prepare-logos.sh -l /path/to/light.png -d /path/to/dark.png \
#     [-o apps/desktop/public] [--size 96] [--square-bg-light '#ffffff'] [--square-bg-dark '#0b1220']
#
# Notes:
# - Prefers ImageMagick (magick/convert) for precise square canvas. Falls back to sips (macOS).
# - Outputs:
#     <out>/logo-light.png
#     <out>/logo-dark.png
# - Optionally squares the logo with a solid background so it renders crisply in small containers.

LIGHT_SRC=""
DARK_SRC=""
OUT_DIR="apps/desktop/public"
# Output square size (recommend >= 128 for crisp downscaling)
SIZE=192
# Extra inner padding (in px) after trim, before squaring
PAD=12
# Trim fuzz to remove near‑solid backgrounds on the source
TRIM_FUZZ="8%"
# Mild sharpening after downscale to keep edges crisp
UNSHARP="0x0.5"
# Backgrounds for final square
BG_LIGHT="#ffffff"
BG_DARK="#0b1220"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -l|--light)
      LIGHT_SRC="$2"; shift 2;;
    -d|--dark)
      DARK_SRC="$2"; shift 2;;
    -o|--out-dir)
      OUT_DIR="$2"; shift 2;;
    --size)
      SIZE="$2"; shift 2;;
    --pad)
      PAD="$2"; shift 2;;
    --trim-fuzz)
      TRIM_FUZZ="$2"; shift 2;;
    --unsharp)
      UNSHARP="$2"; shift 2;;
    --square-bg-light)
      BG_LIGHT="$2"; shift 2;;
    --square-bg-dark)
      BG_DARK="$2"; shift 2;;
    -h|--help)
      sed -n '1,60p' "$0"; exit 0;;
    *)
      echo "Unknown arg: $1" >&2; exit 1;;
  esac
done

if [[ -z "$LIGHT_SRC" || -z "$DARK_SRC" ]]; then
  echo "Error: both --light and --dark source images are required." >&2
  sed -n '1,40p' "$0" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

has_magick() {
  command -v magick >/dev/null 2>&1 || command -v convert >/dev/null 2>&1
}

process_with_magick() {
  local src="$1"; shift
  local out="$1"; shift
  local bg="$1"; shift

  # Compute target area inside the square after padding
  local target
  target=$(( SIZE - 2 * PAD ))

  # Use Lanczos filter with slight blur to avoid ringing
  # Pipeline: trim → resize to target box → optional sharpen → square extent with bg
  if command -v magick >/dev/null 2>&1; then
    magick "$src" \
      -colorspace sRGB -strip \
      -fuzz "$TRIM_FUZZ" -trim +repage \
      -filter Lanczos -define filter:blur=0.9 -resize "${target}x${target}>" \
      -unsharp "$UNSHARP" \
      -background "$bg" -gravity center -extent "${SIZE}x${SIZE}" \
      -quality 95 PNG32:"$out"
  else
    convert "$src" \
      -colorspace sRGB -strip \
      -fuzz "$TRIM_FUZZ" -trim +repage \
      -filter Lanczos -define filter:blur=0.9 -resize "${target}x${target}>" \
      -unsharp "$UNSHARP" \
      -background "$bg" -gravity center -extent "${SIZE}x${SIZE}" \
      -quality 95 PNG32:"$out"
  fi
}

process_with_sips() {
  local src="$1"; shift
  local out="$1"; shift
  # sips can't add canvas easily; best-effort resize preserving aspect.
  sips -Z "$SIZE" "$src" --out "$out" >/dev/null
}

OUT_LIGHT="$OUT_DIR/logo-light.png"
OUT_DARK="$OUT_DIR/logo-dark.png"

echo "Preparing logos → $OUT_DIR (size ${SIZE}px, pad ${PAD}px, fuzz ${TRIM_FUZZ}, unsharp ${UNSHARP})"
if has_magick; then
  echo "Using ImageMagick"
  process_with_magick "$LIGHT_SRC" "$OUT_LIGHT" "$BG_LIGHT"
  process_with_magick "$DARK_SRC" "$OUT_DARK" "$BG_DARK"
else
  if command -v sips >/dev/null 2>&1; then
    echo "ImageMagick not found; falling back to sips (no squaring)"
    process_with_sips "$LIGHT_SRC" "$OUT_LIGHT"
    process_with_sips "$DARK_SRC" "$OUT_DARK"
  else
    echo "Error: Neither ImageMagick nor sips is available. Install ImageMagick (brew install imagemagick) or run on macOS." >&2
    exit 1
  fi
fi

echo "Done:"
ls -lah "$OUT_LIGHT" "$OUT_DARK" 2>/dev/null || true
