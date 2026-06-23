# dispatch

Dispatch IA et audio MacroDroid : assistant vocal carte, ranking techniciens.

## Points d'entrée

| Fichier                                       | Rôle                                    |
| --------------------------------------------- | --------------------------------------- |
| `hooks/useAiAudioPlayback.ts`                 | Orchestrateur queue audio (~139 lignes) |
| `hooks/useAiAudioPlaybackEngine.ts`           | Hook lecture clip (start/stop/cleanup)  |
| `hooks/aiAudioPlaybackEnginePlayHead.ts`      | Boucle playHead + fin de clip           |
| `hooks/aiAudioPlaybackEngineGraph.ts`         | AudioContext + analyser media element   |
| `hooks/aiAudioPlaybackEngineBuffer.ts`        | BufferSource decode + stop              |
| `hooks/aiAudioPlaybackEngineFetch.ts`         | Téléchargement clip + play HTMLAudio    |
| `hooks/aiAudioPlaybackEngineTypes.ts`         | Types refs/setters moteur audio         |
| `hooks/useTechnicianAssignPicker.ts`          | Logique assignation + scoring IA        |
| `components/TechnicianAssignPicker.tsx`       | Shell UI assignation (~130 lignes)      |
| `components/TechnicianAssignPickerHeader.tsx` | En-tête adresse + fermer                |
| `components/TechnicianAssignPickerFooter.tsx` | Actions annuler / confirmer             |
| `components/TechnicianAssignPickerOption.tsx` | Ligne technicien classée                |
| `technicianAssignPickerFormat.ts`             | Distance km, clés statut                |
| `components/AiAssistant.tsx`                  | Strip audio carte                       |
| `rankTechniciansForIntervention.ts`           | Classement pure                         |

## Données

- Firestore : `ai_status/macrodroid`
- API : `/api/ai/audios`, `/api/ai/resolve-audio-url`

## Dépendances

- `map`, `interventions`, `technicians`, `backoffice`, `caseHub`

## Pièges

- `backgroundTasksEnabled` hors page carte mobile
- `DispatchWeekCalendar` non monté

## Tests

```bash
npx jest src/features/dispatch --no-coverage
```
