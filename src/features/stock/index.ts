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
export { handleVehicleStockAgentPost } from "@/features/stock/vehicleStockAgentRouteHandler";
export type {
  VehicleStockAgentPostBody,
  VehicleStockAgentRouteAuth,
} from "@/features/stock/vehicleStockAgentRouteHandler";
export { useVehicleStockAgent } from "@/features/stock/hooks/useVehicleStockAgent";
