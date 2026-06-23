# catalog

Catalogue produits société (`companies/{id}/products`) **et** intégration Lecot (recherche, scraping images, configuration boutique).

Deux moitiés à distinguer : **catalogue interne société** et **stack Lecot** (fournisseur externe).

## Points d'entrée — catalogue société

| Fichier                              | Rôle                                             |
| ------------------------------------ | ------------------------------------------------ |
| `components/CompanyCatalogPanel.tsx` | UI gestion catalogue (ajout, édition, recherche) |
| `components/ProductQuickAddBar.tsx`  | Barre ajout rapide (consommée par `materials/`)  |
| `catalogFirestore.ts`                | CRUD Firestore catalogue société                 |
| `loadCompanyCatalog.ts`              | Loader (cache, fallback)                         |
| `mapCompanyCatalogProduct.ts`        | Mapping Firestore → modèle UI                    |
| `productQuickAdd.ts`                 | Logique ajout rapide (17 imports cross-feature)  |
| `locksmithStockSeedCatalog.ts`       | Catalogue seed démo serrurier                    |

## Points d'entrée — Lecot

| Fichier                          | Rôle                                         |
| -------------------------------- | -------------------------------------------- |
| `lecotApiSearch.ts`              | Recherche via API Lecot (si `LECOT_API_URL`) |
| `lecotCatalog.ts`                | Catalogue local (fallback hors API)          |
| `lecotShopConfig.ts`             | Config boutique (flag `lecotProductSearch`)  |
| `lecotImageCrawler.ts`           | Point d'entrée crawler images Lecot          |
| `lecotImageCrawlerTypes.ts`      | Types crawl / rapport                        |
| `lecotImageCrawlerUtils.ts`      | Pool, cache page, fetch backoff              |
| `lecotImageCrawlerResolve.ts`    | Chaîne résolution vignette (API→Playwright)  |
| `lecotImageCrawlerIndex.ts`      | Merge index + overlays label/SKU             |
| `lecotPlaywrightScraper.ts`      | Scraper Playwright (307 L)                   |
| `lecotPlaywrightBrowser.ts`      | Wrapper navigateur Playwright                |
| `lecotProductImage*.ts`          | Stack résolution / cache images produits     |
| `parseLecotSearchHtmlImage.ts`   | Parse HTML résultats Lecot                   |
| `lecotSupplierOrder.ts`          | Création commande fournisseur Lecot          |
| `lecotOrderFlags.ts`             | Flags / état commande Lecot                  |
| `lecotGuestInfoFromFirestore.ts` | Info compte invité depuis Firestore          |

## Données

- Firestore : `companies/{id}/products`
- API externes : `LECOT_API_URL` (recherche), scraping Playwright (images)
- Routes : `/api/catalog/lecot-images`, `/api/catalog/lecot-search`

## Dépendances autorisées

- `chatbot/` — outil `search_lecot_products` consomme `lecotApiSearch`
- `materials/` — orders importent `lecotSupplierOrder`
- `featureHub/` — UI matériel passe par catalog

## Pièges

- Flag `lecotProductSearch` (feature flag) — bascule API vs catalogue local
- Scraping Playwright = côté serveur uniquement (route Node)
- Cache image `lecotProductImageCache.ts` — invalidation à surveiller

## Tests

```bash
npx jest src/features/catalog --no-coverage
```
