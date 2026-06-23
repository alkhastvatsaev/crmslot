import type { CompanyStockDashboardMetrics } from "@/features/featureHub/companyStockMetrics";
import { sortStockByPatronPriority } from "@/features/featureHub/companyStockMetrics";
import {
  applyStockListFilters,
  isLowStockItem,
  type CompanyStockFilter,
} from "@/features/featureHub/filterCompanyStock";
import type { MaterialOrderDoc } from "@/features/materials";
import type { StockItem } from "@/features/materials";
import type { SupplierOrder } from "@/features/suppliers";

/** Filtre initial : le problème le plus urgent en premier. */
export function resolveSmartFilter(metrics: CompanyStockDashboardMetrics): CompanyStockFilter {
  if (metrics.pendingFieldOrders > 0) return "orders";
  if (metrics.outCount > 0) return "out";
  if (metrics.lowCount > 0) return "low";
  return "all";
}

export function pickFocusStockItemId(
  items: StockItem[],
  filter: CompanyStockFilter,
  openOrderRefs: Set<string>
): string | null {
  const rows = applyStockListFilters(items, {
    filter,
    category: "all",
    search: "",
    openOrderRefs,
  });
  return rows[0]?.id ?? sortStockByPatronPriority(items)[0]?.id ?? null;
}

export type StockAutopilotPlan = {
  /** Libellé i18n pour le bouton unique */
  labelKey: string;
  /** Sous-titre i18n (ce qui sera fait) */
  subtitleKey: string;
  orderIdsToApprove: string[];
  chatbotPrompt: string | null;
  sendChatbot: boolean;
  issueCount: number;
};

export function buildAutopilotChatbotPrompt(input: {
  items: StockItem[];
  orders: MaterialOrderDoc[];
  supplierOrders: SupplierOrder[];
  metrics: CompanyStockDashboardMetrics;
  selected: StockItem | null;
}): string {
  const { items, orders, metrics, selected } = input;
  const out = items.filter((i) => i.quantity <= 0);
  const low = items.filter((i) => i.quantity > 0 && isLowStockItem(i));
  const pending = orders.filter((o) => o.status === "pending");

  const lines: string[] = [
    "Tu es le copilote matériel d'une entreprise de serrurerie en Belgique. Agis sans me redemander de cliquer : propose un plan d'action concret.",
    "",
    `État : ${metrics.outCount} rupture(s), ${metrics.lowCount} stock bas, ${pending.length} demande(s) terrain en attente, ${metrics.waitingMaterialJobs} chantier(s) bloqué(s) sans matériel, ${metrics.openSupplierOrders} commande(s) fournisseur ouverte(s).`,
  ];

  if (out.length > 0) {
    lines.push("", "Ruptures :");
    for (const i of out.slice(0, 12)) {
      lines.push(
        `- ${i.description} (réf. ${i.reference || "—"}, qté ${i.quantity}, seuil ${i.alertThreshold})`
      );
    }
  }
  if (low.length > 0) {
    lines.push("", "Stock bas :");
    for (const i of low.slice(0, 12)) {
      lines.push(
        `- ${i.description} (réf. ${i.reference || "—"}, qté ${i.quantity}/${i.alertThreshold})`
      );
    }
  }
  if (pending.length > 0) {
    lines.push(
      "",
      "Demandes techniciens (déjà validées côté patron si tu vois ce message après coup) :"
    );
    for (const o of pending.slice(0, 8)) {
      const parts = (o.partsRequested ?? [])
        .map((p) => p.description || p.reference)
        .filter(Boolean)
        .join(", ");
      lines.push(`- Intervention ${o.interventionId} : ${parts || "pièces non détaillées"}`);
    }
  }
  if (selected) {
    lines.push(
      "",
      `Focus actuel : ${selected.description} (réf. ${selected.reference || "—"}, qté ${selected.quantity}).`
    );
  }

  lines.push(
    "",
    "À faire maintenant : 1) prioriser les achats Lecot pour les ruptures, 2) regrouper une commande fournisseur si pertinent, 3) indiquer les seuils à ajuster. Réponds en français, listes courtes, actions numérotées."
  );

  return lines.join("\n");
}

export function resolveAutopilotPlan(input: {
  items: StockItem[];
  orders: MaterialOrderDoc[];
  supplierOrders: SupplierOrder[];
  metrics: CompanyStockDashboardMetrics;
  selected: StockItem | null;
}): StockAutopilotPlan {
  const pending = input.orders.filter((o) => o.status === "pending");
  const orderIdsToApprove = pending.map((o) => o.id);
  const stockIssues =
    input.metrics.outCount + input.metrics.lowCount + input.metrics.waitingMaterialJobs;
  const issueCount = orderIdsToApprove.length + stockIssues;
  const needsChatbot = stockIssues > 0 || input.metrics.openSupplierOrders > 0;
  const chatbotPrompt = needsChatbot ? buildAutopilotChatbotPrompt(input) : null;

  if (orderIdsToApprove.length > 0 && needsChatbot) {
    return {
      labelKey: "companyStock.autopilot_fix_all",
      subtitleKey: "companyStock.autopilot_fix_all_sub",
      orderIdsToApprove,
      chatbotPrompt,
      sendChatbot: true,
      issueCount,
    };
  }
  if (orderIdsToApprove.length > 0) {
    return {
      labelKey: "companyStock.autopilot_approve",
      subtitleKey: "companyStock.autopilot_approve_sub",
      orderIdsToApprove,
      chatbotPrompt: null,
      sendChatbot: false,
      issueCount,
    };
  }
  if (needsChatbot) {
    return {
      labelKey: "companyStock.autopilot_stock",
      subtitleKey: "companyStock.autopilot_stock_sub",
      orderIdsToApprove: [],
      chatbotPrompt,
      sendChatbot: true,
      issueCount,
    };
  }
  return {
    labelKey: "companyStock.autopilot_ok",
    subtitleKey: "companyStock.autopilot_ok_sub",
    orderIdsToApprove: [],
    chatbotPrompt: buildAutopilotChatbotPrompt(input),
    sendChatbot: false,
    issueCount: 0,
  };
}
