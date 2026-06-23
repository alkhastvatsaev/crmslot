# calendar

Grille calendrier mensuelle interventions, export ICS et deep links.

## Points d'entrée

| Fichier                                           | Rôle                                                                  |
| ------------------------------------------------- | --------------------------------------------------------------------- |
| \`index.ts\`                                      | **Barrel public** — imports cross-feature via \`@/features/calendar\` |
| `components/InterventionCalendarPanel.tsx`        | Orchestrateur agenda (~215 lignes)                                    |
| `hooks/useInterventionCalendarPanelController.ts` | État, navigation, données                                             |
| `components/InterventionCalendarMonthGrid.tsx`    | Grille mensuelle                                                      |
| `components/InterventionCalendarWeekGrid.tsx`     | Grille hebdomadaire                                                   |
| `calendarPanelUtils.ts`                           | Helpers dates locale                                                  |

## Données

- interventions (lecture)

## Dépendances

- backoffice, interventions

## Pièges

- Panel pas monté carrousel; schedulingEngine ≠ scheduleConflicts

## Tests

```bash
npx jest src/features/calendar --no-coverage
```
