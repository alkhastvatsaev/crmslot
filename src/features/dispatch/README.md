# dispatch

Dispatch IA et audio MacroDroid : assistant vocal carte, ranking techniciens.

## Points d'entrée

| Fichier                                 | Rôle                                    |
| --------------------------------------- | --------------------------------------- |
| `hooks/useAiAudioPlayback.ts`           | Orchestrateur queue audio (~139 lignes) |
| `components/AiAssistant.tsx`            | Strip audio carte                       |
| `components/TechnicianAssignPicker.tsx` | Assignation + scoring IA                |
| `rankTechniciansForIntervention.ts`     | Classement pure                         |

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
