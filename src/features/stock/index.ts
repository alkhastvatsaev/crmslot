/**
 * API publique stock — stock véhicule technicien + agent IA.
 */
export type { StockItem } from "@/features/stock/types";
export { isStockLow } from "@/features/stock/types";
export {
  subscribeStockItems,
  createStockItem,
  updateStockQuantity,
  updateStockItem,
} from "@/features/stock/stockFirestore";
export { buildVehicleStockAgentSystemPrompt } from "@/features/stock/vehicleStockAgentSystemPrompt";
export { useVehicleStockAgent } from "@/features/stock/hooks/useVehicleStockAgent";

// Modules consommés cross-feature (audit:barrels:public).
export * from "@/features/stock/vehicleStockAgentRouteHandler";
