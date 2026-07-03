#!/usr/bin/env bash
# Build APK debug admin + terrain (2 apps installables côte à côte sur Android).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
GRADLE="${ROOT}/scripts/mobile/gradlew-with-jbr.sh"
OUT_DIR="${ROOT}/dist/mobile"
BASE_URL="${CAPACITOR_BASE_URL:-https://crmslot.vercel.app}"
mkdir -p "$OUT_DIR"

capitalize() {
  local s="$1"
  echo "$(tr '[:lower:]' '[:upper:]' <<< "${s:0:1}")${s:1}"
}

build_variant() {
  local flavor="$1"
  local url="$2"
  local outfile="$3"
  local flavor_cap
  flavor_cap="$(capitalize "$flavor")"

  echo ""
  echo "════════════════════════════════════════"
  echo "→ Build ${flavor} (${url})"
  echo "════════════════════════════════════════"

  CAPACITOR_SERVER_URL="$url" npx cap sync android
  "${GRADLE}" "assemble${flavor_cap}Debug"

  local apk_src="${ROOT}/android/app/build/outputs/apk/${flavor}/debug/app-${flavor}-debug.apk"
  if [[ ! -f "$apk_src" ]]; then
    echo "APK introuvable: $apk_src" >&2
    exit 1
  fi
  cp "$apk_src" "${OUT_DIR}/${outfile}"
  echo "✓ ${OUT_DIR}/${outfile} ($(du -h "${OUT_DIR}/${outfile}" | awk '{print $1}'))"
}

build_variant technician "${BASE_URL}/m/technician" "crmslot-terrain.apk"
build_variant admin "${BASE_URL}/" "crmslot-admin.apk"

echo ""
echo "════════════════════════════════════════"
echo "APK prêts pour Telegram :"
echo "  ${OUT_DIR}/crmslot-terrain.apk  (app Technicien)"
echo "  ${OUT_DIR}/crmslot-admin.apk    (app Admin)"
echo ""
echo "Envoi Telegram : pièce jointe → choisir les 2 fichiers .apk"
echo "Sur Android : autoriser « sources inconnues », installer chaque APK."
echo "════════════════════════════════════════"
