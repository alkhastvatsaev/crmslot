/**
 * API publique materials — stock entreprise et commandes matériel.
 * Ne pas confondre avec `stock/` (véhicule) ni `catalog/` (Lecot).
 */
export type { MaterialOrderPart, MaterialOrder } from "@/features/materials/types";
export {
  MATERIAL_ORDERS_COLLECTION,
  subscribeMaterialOrders,
  createMaterialOrderDoc,
  updateMaterialOrderStatus,
} from "@/features/materials/materialOrderFirestore";
export type { MaterialOrderDoc } from "@/features/materials/materialOrderFirestore";
export type { StockItem, StockItemInput } from "@/features/materials/stockFirestore";
export {
  createStockItem,
  adjustStockQuantity,
  updateStockItem,
  subscribeStockItems,
} from "@/features/materials/stockFirestore";
export type { CreateMaterialOrderParams } from "@/features/materials/createMaterialOrder";
export { createMaterialOrder } from "@/features/materials/createMaterialOrder";
export { generateMaterialOrdersPdf } from "@/features/materials/generateMaterialOrderPdf";
export { useMaterialOrders } from "@/features/materials/useMaterialOrders";
export type { InterventionMaterialOrderIntent } from "@/features/materials/interventionMaterialOrderPrompt";
export {
  buildInterventionMaterialOrderPrompt,
  parseInterventionMaterialOrderIntent,
  isInterventionMaterialOrderPrompt,
} from "@/features/materials/interventionMaterialOrderPrompt";
export {
  stockItemHasDisplayImage,
  suggestMaterialPartsFromIntervention,
} from "@/features/materials/suggestMaterialPartsFromIntervention";
export { orderInterventionPartViaMaterialAgent } from "@/features/materials/orderInterventionPartViaMaterialAgent";
export type { CatalogMatchedPart } from "@/features/materials/matchStockCatalogItem";
export {
  matchStockCatalogItem,
  enrichMaterialPartSuggestions,
} from "@/features/materials/matchStockCatalogItem";
export {
  buildStockCatalogById,
  stockItemsForSuggestionImages,
  resolveMaterialSuggestionImageUrl,
} from "@/features/materials/resolveMaterialSuggestionImage";
export {
  MATERIAL_ORDER_CLIENT_FALLBACK,
  readStoredOrderClientName,
  requireMaterialOrderClientName,
  displayMaterialOrderClientName,
} from "@/features/materials/materialOrderClientName";
