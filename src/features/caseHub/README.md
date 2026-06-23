# caseHub

Hub Dossiers (slot 6) : pipeline Situation → Choisir → Agir sur interventions.

## Points d'entrée

| Fichier                                | Rôle                                                                 |
| -------------------------------------- | -------------------------------------------------------------------- |
| \`index.ts\`                           | **Barrel public** — imports cross-feature via \`@/features/caseHub\` |
| `components/CaseHubPage.tsx`           | Orchestrateur buckets                                                |
| `caseHubPatronMetrics.ts`              | Buckets, tri urgence                                                 |
| `caseHubInterventionDetail.ts`         | Barrel détail dossier (types, alerts, insights)                      |
| `caseHubInterventionDetailTypes.ts`    | Types snapshot / alertes / insights                                  |
| `caseHubInterventionDetailAlerts.ts`   | Alertes + badges drawer + assignation technicien                     |
| `caseHubInterventionDetailInsights.ts` | Insights temporels / marge / client récurrent                        |
| `caseHubInterventionDetailSnapshot.ts` | Agrégation `buildCaseHubDetailSnapshot`                              |
| `caseHubConstants.ts`                  | `CASE_HUB_SLOT_INDEX = 6`                                            |

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
