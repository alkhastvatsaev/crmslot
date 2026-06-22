# materials

Stock entreprise stockItems et commandes material_orders.

## Points d'entrée

| Fichier                    | Rôle                     |
| -------------------------- | ------------------------ |
| `StockManagementPanel.tsx` | Point d'entrée principal |
| _(voir dossier)_           | Modules colocalisés      |

## Données

- stockItems, material_orders

## Dépendances

- catalog, featureHub, suppliers, chatbot

## Pièges

- ≠ stock véhicule (features/stock)

## Tests

```bash
npx jest src/features/materials --no-coverage
```
