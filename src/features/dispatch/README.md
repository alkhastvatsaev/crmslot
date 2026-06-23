# dispatch

Dispatch IA et audio MacroDroid : assistant vocal carte, ranking techniciens.

## Points d'entrée

| Fichier                                       | Rôle                                    |
| --------------------------------------------- | --------------------------------------- |
| `hooks/useAiAudioPlayback.ts`                 | Orchestrateur queue audio (~139 lignes) |
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
