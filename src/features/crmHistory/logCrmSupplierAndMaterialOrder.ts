import { getAdminDb } from "@/core/config/firebase-admin";
import { logger } from "@/core/logger";
import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";
import type { CompanyRole } from "@/features/company/types";
import type { Intervention } from "@/features/interventions/types";
import type { WorkflowOwnerRole } from "@/features/interventions/workflow/interventionWorkflowTypes";
import { SUPPLIER_ORDER_STATUS_LABELS, type SupplierOrderLine } from "@/features/suppliers/types";
import { buildCompanyCrmActivityPayload, type CompanyCrmActivityKind } from "./crmActivityLog";
import { dispatchCrmOrdersChanged } from "./crmOrdersChangedEvent";
import { logCompanyCrmActivityAdmin } from "./logCompanyCrmActivityAdmin";

function actorRoleFromCtx(ctx: Pick<ChatbotToolContext, "role">): WorkflowOwnerRole {
  return ctx.role === "admin" || ctx.role === "collaborateur" ? "dispatcher" : "dispatcher";
}

function formatLinesSummary(lines: SupplierOrderLine[]): string {
  return lines
    .map((l) => `${l.quantity}× ${l.label}`)
    .join(", ")
    .slice(0, 240);
}

async function loadInterventionForCrm(
  companyId: string,
  interventionId: string
): Promise<Pick<
  Intervention,
  | "id"
  | "title"
  | "address"
  | "status"
  | "clientName"
  | "clientFirstName"
  | "clientLastName"
  | "clientCompanyName"
> | null> {
  const snap = await getAdminDb().collection("interventions").doc(interventionId).get();
  if (!snap.exists) return null;
  const data = snap.data() as Record<string, unknown>;
  if (String(data.companyId ?? "").trim() !== companyId.trim()) return null;
  return {
    id: snap.id,
    title: typeof data.title === "string" ? data.title : "Dossier",
    address: typeof data.address === "string" ? data.address : "",
    status: (typeof data.status === "string" ? data.status : "pending") as Intervention["status"],
    clientName: typeof data.clientName === "string" ? data.clientName : undefined,
    clientFirstName: typeof data.clientFirstName === "string" ? data.clientFirstName : null,
    clientLastName: typeof data.clientLastName === "string" ? data.clientLastName : null,
    clientCompanyName: typeof data.clientCompanyName === "string" ? data.clientCompanyName : null,
  };
}

function companyLevelInterventionStub(
  interventionId: string | null | undefined,
  clientName: string | null | undefined
): Pick<
  Intervention,
  | "id"
  | "title"
  | "address"
  | "status"
  | "clientName"
  | "clientFirstName"
  | "clientLastName"
  | "clientCompanyName"
> {
  return {
    id: interventionId?.trim() || "stock",
    title: interventionId?.trim() ? "Dossier lié" : "Commande matériel société",
    address: "",
    status: "pending",
    clientName: clientName?.trim() || undefined,
    clientFirstName: null,
    clientLastName: null,
    clientCompanyName: null,
  };
}

async function writeCrmActivity(
  companyId: string,
  kind: CompanyCrmActivityKind,
  actorUid: string,
  actorRole: WorkflowOwnerRole,
  iv: Pick<
    Intervention,
    | "id"
    | "title"
    | "address"
    | "status"
    | "clientName"
    | "clientFirstName"
    | "clientLastName"
    | "clientCompanyName"
  >,
  note: string,
  extra?: { statusAfter?: Intervention["status"] }
): Promise<void> {
  const payload = buildCompanyCrmActivityPayload(
    companyId,
    kind,
    { uid: actorUid, role: actorRole },
    iv,
    { note, statusAfter: extra?.statusAfter }
  );
  try {
    await logCompanyCrmActivityAdmin(getAdminDb(), payload);
    dispatchCrmOrdersChanged({ companyId: payload.companyId });
  } catch (e) {
    logger.warn("[logCrmSupplierAndMaterialOrder]", {
      kind,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

/** Journal serveur — commande fournisseur Lecot (page Matériel / chatbot). */
export async function logCrmSupplierOrderPlacedAdmin(params: {
  ctx: Pick<ChatbotToolContext, "companyId" | "actorUid" | "role">;
  supplierOrderId: string;
  lines: SupplierOrderLine[];
  totalCents: number;
  status: string;
  interventionId?: string | null;
  materialOrderId?: string | null;
  clientName?: string | null;
  demoMode?: boolean;
}): Promise<void> {
  const interventionId = params.interventionId?.trim() || "";
  const clientName = params.clientName?.trim() || "";
  const iv =
    (interventionId ? await loadInterventionForCrm(params.ctx.companyId, interventionId) : null) ??
    companyLevelInterventionStub(interventionId || null, clientName);

  if (clientName && !iv.clientName) {
    iv.clientName = clientName;
  }

  const statusLabel =
    SUPPLIER_ORDER_STATUS_LABELS[params.status as keyof typeof SUPPLIER_ORDER_STATUS_LABELS] ??
    params.status;
  const parts = [
    "Commande Lecot",
    `#${params.supplierOrderId.slice(0, 8)}`,
    `${Math.round(params.totalCents) / 100} € HT`,
    statusLabel,
    formatLinesSummary(params.lines),
  ];
  if (clientName) parts.splice(1, 0, `client: ${clientName}`);
  if (params.materialOrderId) parts.push(`bon matériel ${params.materialOrderId.slice(0, 8)}`);
  if (params.demoMode) parts.push("(démo)");

  await writeCrmActivity(
    params.ctx.companyId,
    "supplier_order_lecot",
    params.ctx.actorUid,
    actorRoleFromCtx(params.ctx),
    iv,
    parts.join(" · ")
  );
}

/** Journal serveur — bon matériel lié à un dossier. */
export async function logCrmMaterialOrderPlacedAdmin(params: {
  ctx: Pick<ChatbotToolContext, "companyId" | "actorUid" | "role">;
  materialOrderId: string;
  interventionId: string;
  partsSummary: string;
  status: string;
  clientName?: string | null;
  supplierOrderId?: string | null;
}): Promise<void> {
  const iv =
    (await loadInterventionForCrm(params.ctx.companyId, params.interventionId)) ??
    companyLevelInterventionStub(params.interventionId, params.clientName);

  const parts = [
    "Bon matériel",
    `#${params.materialOrderId.slice(0, 8)}`,
    params.partsSummary,
    `statut ${params.status}`,
  ];
  if (params.supplierOrderId) parts.push(`fournisseur ${params.supplierOrderId.slice(0, 8)}`);

  await writeCrmActivity(
    params.ctx.companyId,
    "material_order_placed",
    params.ctx.actorUid,
    actorRoleFromCtx(params.ctx),
    iv,
    parts.join(" · ")
  );
}

/** Journal — validation / passage en commandé (approve_material_orders). */
export async function logCrmMaterialOrderApprovedAdmin(params: {
  companyId: string;
  actorUid: string;
  role?: CompanyRole | null;
  materialOrderId: string;
  interventionId?: string | null;
  clientName?: string | null;
}): Promise<void> {
  const interventionId = params.interventionId?.trim() || "";
  const iv =
    (interventionId ? await loadInterventionForCrm(params.companyId, interventionId) : null) ??
    companyLevelInterventionStub(interventionId || null, params.clientName);

  await writeCrmActivity(
    params.companyId,
    "material_order_status_changed",
    params.actorUid,
    params.role === "admin" || params.role === "collaborateur" ? "dispatcher" : "dispatcher",
    iv,
    `Demande matériel validée · #${params.materialOrderId.slice(0, 8)} → commandé`,
    { statusAfter: "pending" }
  );
}
