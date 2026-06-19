#!/usr/bin/env bash
# Supprime les artefacts de dev lourds (≈2–3 Go .next). Safe : rebuild au prochain npm run dev.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Avant :"
du -sh .next .next-e2e-gate coverage 2>/dev/null || true

rm -rf .next .next-e2e-gate
# coverage optionnel — décommenter si besoin :
# rm -rf coverage

echo "Après :"
du -sh . 2>/dev/null
echo "OK — lancer npm run dev pour reconstruire .next"
