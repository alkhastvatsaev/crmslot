#!/usr/bin/env bash
# Artefacts locaux lourds (safe — régénérables au prochain build/dev).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "Nettoyage CRMSLOT…"
rm -rf \
  .next .next-e2e-gate \
  coverage test-results playwright-report .playwright-mcp \
  ios/build ios/DerivedData \
  android/app/build android/build android/.gradle

find . -name '.DS_Store' -delete 2>/dev/null || true
rm -f tsconfig.tsbuildinfo tsconfig.*.tsbuildinfo 2>/dev/null || true

echo "Taille après nettoyage :"
du -sh . node_modules ios android 2>/dev/null || du -sh .
echo "OK — npm run dev / cap sync pour reconstruire si besoin."
