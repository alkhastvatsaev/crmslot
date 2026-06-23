import type { ChatbotQuickAction } from "@/features/chatbot/chatbot-quick-actions";
import type { CompanyStockDashboardMetrics } from "@/features/featureHub/companyStockMetrics";
import type { MaterialOrderDoc } from "@/features/materials";
import type { StockItem } from "@/features/materials";

export type CompanyStockAgentMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  suggestions?: string[];
  /** Boutons Commander Lecot (stream catalogue instantané). */
  quickActions?: ChatbotQuickAction[];
};

export type CompanyStockAgentContext = {
  companyId: string;
  items: StockItem[];
  orders: MaterialOrderDoc[];
  metrics: CompanyStockDashboardMetrics;
};

export type CompanyStockAgentIntent =
  | "greeting"
  | "help"
  | "off_topic"
  | "summary"
  | "list_out"
  | "list_low"
  | "list_alerts"
  | "search"
  | "pending_orders"
  | "waiting_jobs"
  | "lecot"
  | "add_item"
  | "autopilot";

export type CompanyStockAgentAction = {
  focusStockItemId?: string;
  searchQuery?: string;
};

export type CompanyStockAgentTurnResult = {
  intent: CompanyStockAgentIntent;
  reply: string;
  refused: boolean;
  action?: CompanyStockAgentAction;
  suggestions?: string[];
};
