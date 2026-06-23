# suppliers

Commandes fournisseur supplierOrders.

## Points d'entrée

| Fichier                | Rôle                                                                   |
| ---------------------- | ---------------------------------------------------------------------- |
| \`index.ts\`           | **Barrel public** — imports cross-feature via \`@/features/suppliers\` |
| `supplierFirestore.ts` | Point d'entrée principal                                               |
| _(voir dossier)_       | Modules colocalisés                                                    |

## Données

- companies/{id}/supplierOrders

## Dépendances

- featureHub, chatbot, materials

## Pièges

- UI via chatbot/featureHub

## Tests

```bash
npx jest src/features/suppliers --no-coverage
```
