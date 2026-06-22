# scheduling

Créneaux proposés, conflits, drag-board inbox.

## Points d'entrée

| Fichier                | Rôle                     |
| ---------------------- | ------------------------ |
| `scheduleConflicts.ts` | Point d'entrée principal |
| _(voir dossier)_       | Modules colocalisés      |

## Données

- interventions (scheduledDate/Time)

## Dépendances

- backoffice, dispatch, technicians

## Pièges

- MultiTechScheduleBoard orphelin

## Tests

```bash
npx jest src/features/scheduling --no-coverage
```
