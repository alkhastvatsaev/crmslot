# dispatch

Dispatch IA et audio MacroDroid : assistant vocal sur la carte, ranking techniciens, calendrier semaine.

## Points d'entrée

| Fichier                             | Rôle                                              |
| ----------------------------------- | ------------------------------------------------- |
| `components/AiAssistant.tsx`        | Bande audio IA (carte)                            |
| `hooks/useAiAudioPlayback.ts`       | Orchestrateur queue audio — découpe en sous-hooks |
| `hooks/useAiAudioPlaybackEngine.ts` | Lecture Web Audio / HTMLAudioElement              |
| `hooks/useAiAudioFirestoreQueue.ts` | Listener `ai_status/macrodroid`                   |
| `hooks/useAiAudioDiskPoll.ts`       | Polling `/api/ai/audios`                          |
| `audioUtils.ts`                     | Helpers purs (URL, mime, queue dedup)             |
| `rankTechniciansForIntervention.ts` | Algo assignation                                  |

## Données

- Firestore : `ai_status/macrodroid`
- API : `/api/ai/audios`, `/api/ai/resolve-audio-url`
- localStorage : `ai_upload_last_seen_mtime`, `ai_last_listened_updated_at`

## Dépendances autorisées

- `interventions` — types pour ranking/assign
- `map` — AiAssistant monté depuis MapboxView / overlay

## Pièges

- `backgroundTasksEnabled=false` hors page carte mobile (économie batterie)
- Lecture audio : fallback blob URL puis decodeAudioData si autoplay bloqué

## Tests

```bash
npx jest src/features/dispatch --no-coverage
```
