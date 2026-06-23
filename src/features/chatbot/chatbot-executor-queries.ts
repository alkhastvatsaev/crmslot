export {
  db,
  parseIsoMs,
  clientLabel,
  assertInterventionAccess,
} from "@/features/chatbot/chatbot-executor-db";

export {
  fetchStockDocs,
  listStockAlerts,
  listVehicleStock,
  addVehicleStockItem,
  updateVehicleStockItem,
} from "@/features/chatbot/chatbot-executor-stock-queries";

export {
  getWorkspaceSummary,
  listInterventions,
  getInterventionDetail,
  statistiquesPeriode,
  getInterventionBilling,
} from "@/features/chatbot/chatbot-executor-workspace-queries";

export {
  listClients,
  getClientDetail,
  listQuotes,
  listTechnicians,
} from "@/features/chatbot/chatbot-executor-crm-queries";

export {
  listMaterialOrders,
  listCompanyMaterialOrders,
  listSupplierOrders,
} from "@/features/chatbot/chatbot-executor-order-queries";

export {
  listInboxNotifications,
  listInterventionEmails,
  listPortalChat,
} from "@/features/chatbot/chatbot-executor-comms-queries";
