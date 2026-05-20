import type { CatalogProduct } from "@/features/catalog/productQuickAdd";
import lecotProductsJson from "../../../data/catalog/lecot/products.json";

/**
 * Catalogue Lecot embarqué dans la PWA (fichier `data/catalog/lecot/products.json`).
 * Remplacé / complété par l’API Lecot si `LECOT_API_URL` renvoie des hits.
 */
export const LECOT_CATALOG: CatalogProduct[] = lecotProductsJson as CatalogProduct[];
