# Convention features matériel (CRMSLOT)

Cinq features touchent au matériel (catalogue, stock, commandes, équipements client). Plusieurs sont massivement importées (catalog 199, materials 122, suppliers 52) — frontières à respecter pour ne pas casser le graphe.

## Tableau de répartition

| Feature      | Domaine                                        | Firestore                       | Imports cross-feature |
| ------------ | ---------------------------------------------- | ------------------------------- | --------------------- |
| `catalog/`   | Catalogue produits société + intégration Lecot | `companies/{id}/products`       | **199**               |
| `materials/` | Stock **entreprise** + commandes matériel      | `stockItems`, `material_orders` | **122**               |
| `stock/`     | Stock **véhicule** technicien (agent IA dédié) | (sous-collection tech)          | 14                    |
| `suppliers/` | Commandes fournisseur (Peppol, Lecot)          | `companies/{id}/supplierOrders` | 52                    |
| `equipment/` | Inventaire équipements **par client**          | (sous-collection client)        | 8                     |

## Distinctions critiques

- **`materials/` ≠ `stock/`** :
  - `materials/stockItems` = stock entreprise central (entrepôt, magasins société)
  - `stock/` = stock véhicule individuel du technicien (mobile, agent IA conversationnel)
- **`material_orders` ≠ `companies/{id}/supplierOrders`** :
  - `material_orders` = commande interne entreprise (réassort, depuis intervention)
  - `supplierOrders` = commande chez un fournisseur externe (Lecot, etc.) — vit dans `suppliers/`
- **`catalog/` ≠ `materials/`** :
  - `catalog/` = définitions produits (référence, prix catalogue, images Lecot)
  - `materials/` = mouvements (stock + commandes)

## Frontière import

- `materials/` importe `catalog/`, `suppliers/` — frontière propre.
- `catalog/` ne doit jamais importer `materials/` (cycle).
- `equipment/` reste isolée (lié client, pas au flux commande/stock).
- `featureHub/` (UI matériel) importe `materials` + `catalog` + `suppliers` — pas l'inverse.

## Carte du flux principal

```
intervention terrain
    → suggestion IA (materials/suggestMaterialPartsFromIntervention)
    → recherche pièce (catalog/lecotApiSearch)
    → commande interne (materials/createMaterialOrder) + commande fournisseur (suppliers/supplierOrders)
    → consommation sur stock véhicule (stock/)
```

## Pour un agent

1. Ajouter un produit au catalogue → `catalog/`.
2. Créer une commande interne (réassort, depuis dossier) → `materials/`.
3. Commander chez Lecot ou autre fournisseur → `suppliers/` (et écho `materials/`).
4. Stock véhicule technicien → `stock/` (agent IA conversationnel séparé).
5. Équipement installé chez un client (clé, serrure modèle X) → `equipment/`.
6. Ne **jamais** renommer `materialOrderFirestore.ts` ou `stockFirestore.ts` (31 + 29 imports) sans plan de migration.

---

_Convention documentée juin 2026._
