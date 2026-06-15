#!/usr/bin/env bash
# Affiche le SHA-1 debug Android à coller dans Firebase Console → Project settings → Android app.
set -euo pipefail

JAVA_HOME="${JAVA_HOME:-/Applications/Android Studio.app/Contents/jbr/Contents/Home}"
KEYSTORE="${HOME}/.android/debug.keystore"

if [[ ! -x "${JAVA_HOME}/bin/keytool" ]]; then
  echo "keytool introuvable. Installez Android Studio ou définissez JAVA_HOME." >&2
  exit 1
fi

if [[ ! -f "${KEYSTORE}" ]]; then
  echo "Keystore debug absent (${KEYSTORE}). Ouvrez Android Studio une fois pour le générer." >&2
  exit 1
fi

echo "Package Android : com.crmslot.app"
echo ""
"${JAVA_HOME}/bin/keytool" -list -v \
  -keystore "${KEYSTORE}" \
  -alias androiddebugkey \
  -storepass android \
  -keypass android \
  | grep -E "SHA 1:|SHA 256:|SHA1:|SHA256:"
