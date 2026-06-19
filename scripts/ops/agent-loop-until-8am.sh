#!/usr/bin/env bash
# Boucle agent Cursor — tick toutes les 30 min jusqu'à 8h locale.
# Usage: bash scripts/agent-loop-until-8am.sh
set -euo pipefail

INTERVAL_SEC="${AGENT_LOOP_INTERVAL_SEC:-1800}"
PROMPT='Phase C split-apps (branche cursor/split-apps-phase-c): npm run test:agent-check; si OK npm run test:mobile-shell test:native-infra; corriger échecs; améliorer perf/tests E2E /m/demande et /m/technician. Pas de commit sans demande utilisateur.'

end_epoch() {
  python3 - <<'PY'
import datetime
now = datetime.datetime.now()
target = now.replace(hour=8, minute=0, second=0, microsecond=0)
if target <= now:
    target += datetime.timedelta(days=1)
print(int(target.timestamp()))
PY
}

END=$(end_epoch)
echo "Agent loop jusqu'à 8h (epoch $END), intervalle ${INTERVAL_SEC}s"

while [ "$(date +%s)" -lt "$END" ]; do
  sleep "$INTERVAL_SEC"
  if [ "$(date +%s)" -ge "$END" ]; then
    break
  fi
  printf 'AGENT_LOOP_TICK_split-apps {"prompt":"%s"}\n' "$PROMPT"
done

echo 'AGENT_LOOP_DONE_split-apps {"reason":"8am reached"}'
