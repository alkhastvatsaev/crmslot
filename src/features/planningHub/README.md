# planningHub

Hub Planning (slot 8) : vue jour techniciens et créneaux.

## Points d'entrée

| Fichier                          | Rôle                                                                     |
| -------------------------------- | ------------------------------------------------------------------------ |
| \`index.ts\`                     | **Barrel public** — imports cross-feature via \`@/features/planningHub\` |
| `components/PlanningHubPage.tsx` | Page carrousel                                                           |
| `planningHubPatronMetrics.ts`    | Rows tech, slots pending                                                 |
| `planningHubConstants.ts`        | `PLANNING_HUB_SLOT_INDEX = 8`                                            |

## Données

- Firestore : `interventions`, `technicians` (agrégation client)

## Dépendances

- `backoffice`, `technicians`, `interventions`, `company`

## Pièges

- Date = calendrier local (`localCalendarYmd`)
- Champs détail partagés avec caseHub

## Tests

```bash
npm run test:patron-hubs
```
