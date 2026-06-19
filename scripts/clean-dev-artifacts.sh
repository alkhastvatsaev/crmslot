#!/usr/bin/env bash
# Artefacts locaux lourds (safe — régénérables).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo "Nettoyage…"
rm -rf .next .next-e2e-gate coverage test-results playwright-report .playwright-mcp
find . -name '.DS_Store' -delete 2>/dev/null || true
rm -f tsconfig.tsbuildinfo tsconfig.*.tsbuildinfo 2>/dev/null || true
du -sh . 2>/dev/null
echo "OK — npm run dev pour reconstruire .next"
