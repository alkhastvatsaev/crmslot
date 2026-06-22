# calendar

Grille calendrier mensuelle interventions, export ICS et deep links.

## Points d'entrée

| Fichier                         | Rôle                     |
| ------------------------------- | ------------------------ |
| `InterventionCalendarPanel.tsx` | Point d'entrée principal |
| _(voir dossier)_                | Modules colocalisés      |

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
