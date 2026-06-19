#!/usr/bin/env bash
# Serveur prod-like pour E2E DesktopOnlyGate (port 3001, build séparé).
# Next 16 n’autorise qu’un seul `next dev` par repo — on utilise build + start.
set -euo pipefail
cd "$(dirname "$0")/../.."

export NEXT_E2E_GATE_DIST=1
export NEXT_PUBLIC_DISABLE_DEV_UI_PREVIEW="${NEXT_PUBLIC_DISABLE_DEV_UI_PREVIEW:-true}"
export NEXT_PUBLIC_FIREBASE_API_KEY="${NEXT_PUBLIC_FIREBASE_API_KEY:-placeholder}"
export NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:-placeholder.firebaseapp.com}"
export NEXT_PUBLIC_FIREBASE_PROJECT_ID="${NEXT_PUBLIC_FIREBASE_PROJECT_ID:-placeholder}"
export NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:-placeholder.appspot.com}"
export NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:-0}"
export NEXT_PUBLIC_FIREBASE_APP_ID="${NEXT_PUBLIC_FIREBASE_APP_ID:-1:0:web:0}"
export NEXT_PUBLIC_MAPBOX_TOKEN="${NEXT_PUBLIC_MAPBOX_TOKEN:-pk.placeholder}"

npm run build
exec npm run start -- -p 3001
