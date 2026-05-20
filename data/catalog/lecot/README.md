# Catalogue Lecot (PWA BELGMAP)

## Démonstration client (CRM)

Pour une **démo sans données réelles Lecot** :

1. **Ne pas** configurer `LECOT_API_URL` (le chatbot et la recherche utilisent `products.json`).
2. Activer la recherche catalogue dans l’UI si besoin : `NEXT_PUBLIC_FF_LECOT_PRODUCT_SEARCH=true` (et éventuellement le flag Firestore société `lecotProductSearch` dans `companies/{id}/featureFlags`).
3. **Phrases à montrer** au chatbot : « Je cherche une serrure », « cylindre Yale », « commande Lecot une perceuse » — les SKU viennent du JSON (prix indicatifs).
4. **Commande** : sans canal réel (API / Playwright / compte shop), les commandes passent en **simulation** (`LECOT_DEMO_ORDERS` absent ou ≠ `false` : commande marquée démo, rien d’envoyé chez Lecot).

**Après la démo** : remplacer le contenu de `products.json`, brancher `LECOT_API_URL` si tu as une API, ajouter des produits dans Firestore, puis `LECOT_DEMO_ORDERS=false` quand tu veux du réel.

---

Ce dossier contient le **catalogue local** utilisé par :

- la recherche `/api/catalog/lecot-search` (fallback si pas d’API Lecot ou résultats vides) ;
- le chatbot (`search_lecot_products`) ;
- la fusion avec le catalogue **Firestore** `companies/{id}/products` (produits actifs).

## Fichier principal

| Fichier | Rôle |
|--------|------|
| `products.json` | Tableau d’objets `{ sku, label, unitPriceCents, category? }`. **SKU unique** obligatoire. |

Après modification de `products.json`, relancer le build / dev pour recharger le bundle.

## API Lecot

Si `LECOT_API_URL` est configuré et renvoie des résultats, ceux-ci **priment** pour la recherche web ; le JSON reste le **fallback** et la base hors-ligne.

## Données réelles Lecot

Les lignes ici sont un **jeu démo / structurel** (noms et prix indicatifs). Pour coller au stock Lecot réel :

1. enrichir `products.json` (export interne, scraping autorisé, fichier fournisseur) ;
2. et/ou saisir les références dans **Firestore** → onglet produits société (voir `loadCompanyCatalogProducts`).

## Schéma `products.json`

```json
{
  "sku": "LEC-XXXX",
  "label": "Libellé visible recherche + commande",
  "unitPriceCents": 12500,
  "category": "serrurerie"
}
```

- `unitPriceCents` : prix **HT** en centimes (ex. 125,00 € → `12500`).
- `category` : optionnel ; sert au filtre `?category=serrurerie` sur l’API de recherche.
