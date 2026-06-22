# caseHub

Hub Dossiers (slot 6) : pipeline Situation → Choisir → Agir sur interventions.

## Points d'entrée

| Fichier                      | Rôle                      |
| ---------------------------- | ------------------------- |
| `components/CaseHubPage.tsx` | Orchestrateur buckets     |
| `caseHubPatronMetrics.ts`    | Buckets, tri urgence      |
| `caseHubConstants.ts`        | `CASE_HUB_SLOT_INDEX = 6` |

## Données

- Firestore : `interventions` via `useBackOfficeInterventions`

## Dépendances

- `backoffice`, `interventions`, `dispatch`, `technicians`, `emails`, `planningHub`

## Pièges

- Buckets = pure functions client (`caseHubPatronMetrics.ts`)
- `planningInterventionDetailFields.ts` partagé avec planningHub

## Tests

```bash
npm run test:patron-hubs
```
