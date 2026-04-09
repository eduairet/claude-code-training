#!/usr/bin/env bash
# save-drawing.sh — Saves ASCII art to the drawings/ directory
# Usage: save-drawing.sh <filename> <content>
#   filename: name for the .txt file (without extension)
#   content:  the ASCII art text (passed via stdin)

set -euo pipefail

DRAWINGS_DIR="$(cd "$(dirname "$0")/../../../../drawings" && pwd)"
FILENAME="${1:?Usage: save-drawing.sh <filename>}"

# Sanitize filename: lowercase, replace spaces with hyphens, strip non-alphanumeric
SLUG=$(echo "$FILENAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | sed 's/[^a-z0-9-]//g')
OUTFILE="${DRAWINGS_DIR}/${SLUG}.txt"

# Read ASCII art from stdin and write to file
cat > "$OUTFILE"

echo "Saved drawing to: drawings/${SLUG}.txt"
