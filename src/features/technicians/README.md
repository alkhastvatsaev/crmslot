# technicians

Profils techniciens, compétences, cockpit terrain.

## Points d'entrée

| Fichier                     | Rôle                     |
| --------------------------- | ------------------------ |
| `hooks.ts (useTechnicians)` | Point d'entrée principal |
| _(voir dossier)_            | Modules colocalisés      |

## Données

- technicians

## Dépendances

- map, dispatch, backoffice, planningHub

## Pièges

- Lab /cockpit hors carrousel actuel

## Tests

```bash
npx jest src/features/technicians --no-coverage
```
