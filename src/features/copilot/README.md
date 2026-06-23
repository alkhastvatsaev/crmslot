# copilot

Snapshot workspace + chat SSE léger.

## Points d'entrée

| Fichier                          | Rôle                                                                 |
| -------------------------------- | -------------------------------------------------------------------- |
| \`index.ts\`                     | **Barrel public** — imports cross-feature via \`@/features/copilot\` |
| `useWorkspaceCopilotSnapshot.ts` | Point d'entrée principal                                             |
| _(voir dossier)_                 | Modules colocalisés                                                  |

## Données

- lectures indirectes interventions

## Dépendances

- offline, chatbot, billingHub

## Pièges

- ≠ chatbot galaxy principal

## Tests

```bash
npx jest src/features/copilot --no-coverage
```
