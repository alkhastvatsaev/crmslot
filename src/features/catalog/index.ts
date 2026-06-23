/**
 * API publique catalog — catalogue société, recherche Lecot et images produits.
 */
export type { CatalogProduct } from "@/features/catalog/productQuickAdd";
export {
  STUB_CATALOG,
  filterCatalogForIntervention,
  catalogLineFromProduct,
} from "@/features/catalog/productQuickAdd";
export { LECOT_CATALOG } from "@/features/catalog/lecotCatalog";
export { loadCompanyCatalogProducts } from "@/features/catalog/loadCompanyCatalog";
export { lecotApiBaseUrl, searchLecotViaApi } from "@/features/catalog/lecotApiSearch";
export {
  mergeCatalogProducts,
  searchCatalogProducts,
  searchCatalogProductsScored,
} from "@/features/catalog/searchCatalogProducts";
export {
  lecotShopBaseUrl,
  lecotShopCatalogSearchUrl,
  lecotShopOrigin,
} from "@/features/catalog/lecotShopConfig";
export { submitLecotSupplierOrder } from "@/features/catalog/lecotSupplierOrder";
export type { LecotSupplierOrderResult } from "@/features/catalog/lecotSupplierOrder";
export {
  lecotPlaywrightSearchEnabled,
  lecotPlaywrightOrderEnabled,
  lecotDemoOrdersEnabled,
} from "@/features/catalog/lecotOrderFlags";
export type { LecotImageLookupInput } from "@/features/catalog/lecotProductImageTypes";
export { lookupClientLecotProductImageOverlay } from "@/features/catalog/lecotProductImageClientOverlay";
export {
  matchStockCatalogImageLookup,
  resolveOrderLineImageLookup,
} from "@/features/catalog/matchStockCatalogImageLookup";
export type { StockCatalogImageMatch } from "@/features/catalog/matchStockCatalogImageLookup";
export { labelOverlapScore } from "@/features/catalog/lecotProductImageMatch";
export { normalizeLecotImageLookupKey } from "@/features/catalog/lecotProductImageCache";
export {
  LOCKSMITH_STOCK_SEED_CATALOG,
  locksmithStockCatalogRows,
} from "@/features/catalog/locksmithStockSeedCatalog";
