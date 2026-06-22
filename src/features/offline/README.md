# offline

Sync terrain PWA : queue IndexedDB clôtures.

## Points d'entrée

| Fichier                | Rôle                     |
| ---------------------- | ------------------------ |
| `completionQueueDb.ts` | Point d'entrée principal |
| _(voir dossier)_       | Modules colocalisés      |

## Données

- IndexedDB + cache TanStack

## Dépendances

- interventions, backoffice, copilot

## Pièges

- Hub offline slot archivé

## Tests

```bash
npx jest src/features/offline --no-coverage
```
