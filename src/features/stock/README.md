# stock

Stock véhicule technicien + agent IA dédié.

## Points d'entrée

| Fichier             | Rôle                                                               |
| ------------------- | ------------------------------------------------------------------ |
| \`index.ts\`        | **Barrel public** — imports cross-feature via \`@/features/stock\` |
| `stockFirestore.ts` | Point d'entrée principal                                           |
| _(voir dossier)_    | Modules colocalisés                                                |

## Données

- companies/{id}/technicianStocks

## Dépendances

- hubAgents, chatbot

## Pièges

- Panels UI peu montés

## Tests

```bash
npx jest src/features/stock --no-coverage
```
