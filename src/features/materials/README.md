# materials

Stock entreprise (`stockItems`) et commandes matériel (`material_orders`), incluant suggestions IA, ordering via agent matériel et PDF commandes.

> Ne pas confondre avec `stock/` (= stock véhicule technicien) ni `catalog/` (= catalogue produits + Lecot).

## Points d'entrée

| Fichier                                          | Rôle                                                                   |
| ------------------------------------------------ | ---------------------------------------------------------------------- |
| \`index.ts\`                                     | **Barrel public** — imports cross-feature via \`@/features/materials\` |
| `materialOrderFirestore.ts`                      | CRUD `material_orders` (**31 imports cross-feature**)                  |
| `stockFirestore.ts`                              | CRUD `stockItems` (**29 imports cross-feature**)                       |
| `createMaterialOrder.ts`                         | Création commande (logique métier)                                     |
| `generateMaterialOrderPdf.ts`                    | PDF commande (jsPDF PWA)                                               |
| `useMaterialOrders.ts`                           | Hook abonnement commandes intervention                                 |
| `interventionMaterialOrderPrompt.ts`             | Prompt IA depuis intervention                                          |
| `suggestMaterialPartsFromIntervention.ts`        | Suggestions IA pièces depuis problème terrain                          |
| `orderInterventionPartViaMaterialAgent.ts`       | Création commande depuis agent matériel                                |
| `matchStockCatalogItem.ts`                       | Match item vers entrée catalogue                                       |
| `resolveMaterialSuggestionImage.ts`              | Résolution image suggestion                                            |
| `materialOrderClientName.ts`                     | Formatage nom client                                                   |
| `components/StockManagementPanel.tsx`            | UI gestion stock entreprise                                            |
| `components/InterventionMaterialOrdersPanel.tsx` | Panneau commandes par intervention (~270 L)                            |
| `components/MaterialOrderForm.tsx`               | Formulaire création commande                                           |
| `components/MaterialPartSuggestions.tsx`         | UI suggestions IA                                                      |
| `components/OmniSearchLecot.tsx`                 | Recherche unifiée Lecot                                                |
| `types.ts`                                       | Types `MaterialOrder`, `StockItem`                                     |

## Données

- Firestore : `stockItems`, `material_orders`, `companies/{id}/supplierOrders`
- API : `POST /api/ai/material-agent` (via `featureHub`)

## Dépendances autorisées

- `catalog/` — produits, Lecot
- `featureHub/` — agent matériel
- `suppliers/` — types fournisseur (44 imports)
- `chatbot/` — outils chatbot écriture (`order_lecot_parts`)

## Pièges

- `materialOrderFirestore` et `stockFirestore` = imports cross-feature massifs → ne **jamais** renommer sans plan de migration
- Suggestions IA = côté serveur (route Node), ne pas appeler depuis client offline
- `material_orders` ≠ `companies/{id}/supplierOrders` (commande interne vs commande fournisseur)
- Différencier de `stock/` (stock véhicule)

## Tests

```bash
npx jest src/features/materials --no-coverage
```
