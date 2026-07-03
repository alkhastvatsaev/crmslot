#!/usr/bin/env bash
# Build APK debug « Technicien » (Capacitor, URL prod /m/technician).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "→ cap sync android (terrain)…"
CAPACITOR_SERVER_URL="${CAPACITOR_SERVER_URL:-https://crmslot.vercel.app/m/technician}" \
  npx cap sync android

echo "→ assembleDebug…"
"${ROOT}/scripts/mobile/gradlew-with-jbr.sh" assembleDebug

OUT_DIR="${ROOT}/dist/mobile"
APK_SRC="${ROOT}/android/app/build/outputs/apk/debug/app-debug.apk"
APK_DST="${OUT_DIR}/crmslot-technicien-debug.apk"

mkdir -p "$OUT_DIR"
cp "$APK_SRC" "$APK_DST"

echo ""
echo "✓ APK prêt : ${APK_DST}"
echo "  Installer sur téléphone USB : npm run cap:install:android:debug"
echo "  Ou transférer le fichier .apk (Drive, e-mail, QR…) puis ouvrir sur Android."
