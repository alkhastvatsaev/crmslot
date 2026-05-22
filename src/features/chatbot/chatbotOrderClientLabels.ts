import type { ChatbotInvoiceRow } from "@/features/chatbot/chatbotInvoiceRows";
import type { WorkspaceCopilotSnapshot } from "@/features/copilot/types";
import type { MaterialOrderDoc } from "@/features/materials/materialOrderFirestore";
import { MATERIAL_ORDER_CLIENT_FALLBACK } from "@/features/materials/materialOrderClientName";
import { interventionClientLabel } from "@/features/interventions/technicianSchedule";
import type { Intervention } from "@/features/interventions/types";
import type { SupplierOrder } from "@/features/suppliers/types";

/** Index interventionId → libellé client (dossiers société + factures + snapshot). */
export function buildInterventionClientLabelMap(
  invoices: ChatbotInvoiceRow[],
  snapshot: WorkspaceCopilotSnapshot | null | undefined,
  interventions: Intervention[] = [],
): Map<string, string> {
  const map = new Map<string, string>();

  for (const iv of interventions) {
    const id = iv.id?.trim();
    const label = interventionClientLabel(iv)?.trim();
    if (id && label) map.set(id, label);
  }

  for (const row of invoices ?? []) {
    const id = row.interventionId?.trim();
    const label = row.clientLabel?.trim();
    if (id && label && !map.has(id)) map.set(id, label);
  }

  for (const iv of snapshot?.interventions ?? []) {
    const id = iv.id?.trim();
    const label = iv.clientName?.trim();
    if (id && label && !map.has(id)) map.set(id, label);
  }

  return map;
}

/** Lie chaque commande fournisseur à un dossier (champ direct ou bon matériel associé). */
export function buildSupplierOrderInterventionIdByOrderId(
  supplierOrders: SupplierOrder[],
  materialOrders: MaterialOrderDoc[],
): Map<string, string> {
  const map = new Map<string, string>();

  for (const order of supplierOrders) {
    const ivId = order.interventionId?.trim();
    if (ivId) map.set(order.id, ivId);
  }

  for (const material of materialOrders) {
    const orderId = material.supplierOrderId?.trim();
    const ivId = material.interventionId?.trim();
    if (orderId && ivId && !map.has(orderId)) map.set(orderId, ivId);
  }

  return map;
}

/** Nom client par id commande fournisseur (doc + bon matériel lié). */
export function buildSupplierOrderClientNameByOrderId(
  supplierOrders: SupplierOrder[],
  materialOrders: MaterialOrderDoc[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const material of materialOrders) {
    const orderId = material.supplierOrderId?.trim();
    const name = material.clientName?.trim();
    if (orderId && name) map.set(orderId, name);
  }
  for (const order of supplierOrders) {
    const name = order.clientName?.trim();
    if (name) map.set(order.id, name);
  }
  return map;
}

export function resolveSupplierOrderListClientLabel(
  order: Pick<SupplierOrder, "id" | "clientName" | "interventionId">,
  clientNameBySupplierOrderId: Map<string, string>,
  orderInterventionIdByOrderId: Map<string, string>,
  clientLabelByInterventionId: Map<string, string>,
): string {
  const stored =
    order.clientName?.trim() || clientNameBySupplierOrderId.get(order.id)?.trim() || null;
  return resolveOrderListClientLabel(
    stored,
    resolveSupplierOrderClientLabel(
      order.id,
      order.interventionId,
      orderInterventionIdByOrderId,
      clientLabelByInterventionId,
    ),
  );
}

export function resolveMaterialOrderListClientLabel(
  order: Pick<MaterialOrderDoc, "id" | "clientName" | "interventionId">,
  clientLabelByInterventionId: Map<string, string>,
): string {
  const ivId = order.interventionId?.trim();
  const fromIv = ivId ? (clientLabelByInterventionId.get(ivId) ?? null) : null;
  return resolveOrderListClientLabel(order.clientName, fromIv);
}

export function resolveSupplierOrderClientLabel(
  orderId: string,
  orderInterventionId: string | null | undefined,
  orderIdToInterventionId: Map<string, string>,
  labelByInterventionId: Map<string, string>,
): string | null {
  const ivId = orderInterventionId?.trim() || orderIdToInterventionId.get(orderId) || null;
  if (!ivId) return null;
  return labelByInterventionId.get(ivId) ?? null;
}

/** Libellé principal dans les listes commandes (stocké sur la commande → dossier lié → « Client »). */
export function resolveOrderListClientLabel(
  storedClientName: string | null | undefined,
  resolvedFromIntervention: string | null | undefined,
): string {
  const stored = storedClientName?.trim();
  if (stored) return stored;
  const resolved = resolvedFromIntervention?.trim();
  if (resolved) return resolved;
  return MATERIAL_ORDER_CLIENT_FALLBACK;
}

/** @deprecated Utiliser resolveSupplierOrderClientLabel. */
export function resolveOrderClientLabel(
  interventionId: string | null | undefined,
  labelByInterventionId: Map<string, string>,
): string | null {
  const id = interventionId?.trim();
  if (!id) return null;
  return labelByInterventionId.get(id) ?? null;
}
