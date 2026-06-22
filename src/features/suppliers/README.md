# suppliers

Commandes fournisseur supplierOrders.

## Points d'entrée

| Fichier                | Rôle                     |
| ---------------------- | ------------------------ |
| `supplierFirestore.ts` | Point d'entrée principal |
| _(voir dossier)_       | Modules colocalisés      |

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
