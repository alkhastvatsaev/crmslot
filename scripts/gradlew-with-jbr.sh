#!/usr/bin/env bash
# Gradle wrapper avec JBR Android Studio (macOS).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export JAVA_HOME="${JAVA_HOME:-/Applications/Android Studio.app/Contents/jbr/Contents/Home}"
exec "${ROOT}/android/gradlew" -p "${ROOT}/android" "$@"
