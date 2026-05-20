import * as admin from "firebase-admin";
import { buildAssignInterventionToTechnicianUpdate } from "@/features/interventions/assignInterventionToTechnician";
import { fetchInterventionsForCompany, invalidateInterventionCache, parseCreatedAtMs } from "@/features/chatbot/chatbot-intervention-source";
import { isChatbotWriteTool } from "@/features/chatbot/chatbot-tools";
import {
  clientSearchHaystack,
  fetchAllClientsForCompany,
  formatClientRow,
  matchesWorkspaceQuery,
  searchWorkspace,
} from "@/features/chatbot/chatbot-workspace-search";
import { sendInterventionEmail } from "@/core/services/email/sendInterventionEmail";
import {
  isChatbotDocumentKind,
  type ChatbotDocumentKind,
} from "@/features/chatbot/chatbot-document";
import {
  applyBillingLinePatch,
  billingLinesTotalCents,
  normalizeBillingLinesFromFirestore,
  parseUnitPriceCents,
  type ChatbotBillingLine,
} from "@/features/chatbot/chatbot-billing";
import { clientNameFirestorePatchIfMissing } from "@/features/interventions/resolveInterventionClientName";
import {
  orderLecotPartsForChatbot,
  searchLecotProductsForChatbot,
} from "@/features/chatbot/chatbot-lecot";
import { buildLecotSearchUrl } from "@/features/chatbot/chatbot-lecot-url";
import { resolveSendInterventionEmailAttachType } from "@/features/chatbot/chatbot-email-attach";
import { persistInterventionClientEmail } from "@/features/chatbot/chatbot-client-email";
import {
  getGmailMessageForChatbot,
  linkGmailToIntervention,
  listGmailInboxForChatbot,
  sendGmailReplyFromChatbot,
  suggestGmailInterventionLinksForChatbot,
} from "@/features/chatbot/chatbot-gmail";

export type ChatbotToolContext = {
  companyId: string;
  actorUid: string;
  role: "admin" | "collaborateur" | null;
  /** Dernier message utilisateur (routage PJ email). */
  lastUserText?: string | null;
};

function db(): admin.firestore.Firestore {
  if (!admin.apps.length) {
    throw new Error("Firebase Admin non initialisé");
  }
  return admin.firestore();
}

function parseIsoMs(raw: unknown): number {
  if (!raw) return 0;
  if (typeof raw === "object" && raw !== null && "seconds" in raw) {
    return (raw as { seconds: number }).seconds * 1000;
  }
  if (typeof raw === "string" || typeof raw === "number") {
    const t = Date.parse(String(raw));
    return Number.isFinite(t) ? t : 0;
  }
  return 0;
}

async function fetchStockDocs(companyId: string): Promise<Record<string, unknown>[]> {
  const firestore = db();
  let snap = await firestore.collection("stockItems").where("companyId", "==", companyId).limit(80).get();
  if (snap.empty) {
    snap = await firestore.collection("stock_items").where("companyId", "==", companyId).limit(80).get();
  }
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown>));
}

function clientLabel(data: Record<string, unknown>): string {
  const parts = [data.clientFirstName, data.clientLastName].filter(Boolean).join(" ").trim();
  if (parts) return parts;
  if (typeof data.clientName === "string" && data.clientName.trim()) return data.clientName.trim();
  if (typeof data.clientCompanyName === "string" && data.clientCompanyName.trim()) {
    return data.clientCompanyName.trim();
  }
  return String(data.title || "Client");
}

function requireConfirmed(name: string, input: Record<string, unknown>): void {
  if (name === "order_lecot_parts") return;
  if (!isChatbotWriteTool(name)) return;
  if (input.userConfirmed !== true) {
    throw new Error(
      "Action refusée : confirmation utilisateur requise (userConfirmed: true) avant toute modification.",
    );
  }
}

export async function executeChatbotTool(
  name: string,
  rawInput: unknown,
  ctx: ChatbotToolContext,
): Promise<unknown> {
  const input = (rawInput && typeof rawInput === "object" ? rawInput : {}) as Record<string, unknown>;
  requireConfirmed(name, input);

  switch (name) {
    case "get_workspace_summary":
      return getWorkspaceSummary(ctx.companyId);
    case "list_interventions":
      return listInterventions(ctx.companyId, input);
    case "get_intervention_detail":
      return getInterventionDetail(ctx.companyId, String(input.interventionId || ""));
    case "search_workspace":
      return searchWorkspace(
        db(),
        ctx.companyId,
        String(input.query || input.search || ""),
        Number(input.limit) || 25,
      );
    case "list_clients":
      return listClients(ctx.companyId, input);
    case "get_client_detail":
      return getClientDetail(ctx.companyId, String(input.clientId || ""));
    case "list_quotes":
      return listQuotes(ctx.companyId, input);
    case "list_technicians":
      return listTechnicians(ctx.companyId);
    case "list_stock_alerts":
      return listStockAlerts(ctx.companyId);
    case "list_material_orders":
      return listMaterialOrders(String(input.interventionId || ""), input);

    case "search_lecot_products":
      return searchLecotProductsForChatbot(ctx.companyId, String(input.query || ""), Number(input.limit) || 8);
    case "list_supplier_orders":
      return listSupplierOrders(ctx.companyId, input);
    case "order_lecot_parts":
      return orderLecotPartsForChatbot(ctx, input);
    case "list_inbox_notifications":
      return listInboxNotifications(ctx, input);
    case "list_gmail_inbox":
      return listGmailInboxForChatbot({
        q: String(input.q || ""),
        labelId: String(input.labelId || ""),
        limit: Number(input.limit) || 12,
        unreadOnly: Boolean(input.unreadOnly),
      });
    case "get_gmail_message":
      return getGmailMessageForChatbot(String(input.messageId || ""));
    case "suggest_gmail_intervention_links":
      return suggestGmailInterventionLinksForChatbot(ctx.companyId, {
        messageId: String(input.messageId || ""),
      });
    case "send_gmail_reply":
      return sendGmailReplyFromChatbot(input as { messageId: string; bodyText: string; to?: string; subject?: string });
    case "link_gmail_to_intervention":
      return linkGmailToIntervention(ctx, input as { messageId: string; interventionId: string; note?: string });
    case "list_intervention_emails":
      return listInterventionEmails(String(input.interventionId || ""), input);
    case "get_intervention_billing":
      return getInterventionBilling(ctx.companyId, String(input.interventionId || ""));
    case "list_portal_chat":
      return listPortalChat(ctx.companyId, input);
    case "statistiques_periode":
      return statistiquesPeriode(ctx.companyId, input);
    case "update_intervention_status": {
      const r = await updateInterventionStatus(ctx, input);
      invalidateInterventionCache(ctx.companyId);
      return r;
    }
    case "assign_technician": {
      const r = await assignTechnician(ctx, input);
      invalidateInterventionCache(ctx.companyId);
      return r;
    }
    case "update_intervention_schedule": {
      const r = await updateSchedule(ctx, input);
      invalidateInterventionCache(ctx.companyId);
      return r;
    }
    case "add_timeline_comment":
      return addTimelineComment(ctx, input);
    case "save_client_email":
      return saveClientEmailFromChatbot(ctx, input);
    case "send_intervention_email":
      return sendInterventionEmailFromChatbot(ctx, input);
    case "focus_intervention_document":
      return focusInterventionDocument(ctx, input);
    case "update_intervention_billing":
      return updateInterventionBilling(ctx, input);
    case "patch_intervention_billing":
      return patchInterventionBilling(ctx, input);
    case "append_intervention_billing_lines":
      return appendInterventionBillingLines(ctx, input);
    default:
      throw new Error(`Outil inconnu : ${name}`);
  }
}

async function getWorkspaceSummary(companyId: string) {
  const firestore = db();
  const [interventions, techSnap, stockRows] = await Promise.all([
    fetchInterventionsForCompany(firestore, companyId, 100),
    firestore.collection("technicians").where("companyId", "==", companyId).limit(40).get(),
    fetchStockDocs(companyId),
  ]);
  const byStatus: Record<string, number> = {};
  let urgentOpen = 0;
  let revenueCents = 0;

  for (const iv of interventions) {
    const st = String(iv.status || "pending");
    byStatus[st] = (byStatus[st] ?? 0) + 1;
    if (iv.urgency && st !== "done" && st !== "invoiced" && st !== "cancelled") urgentOpen += 1;
    const lines = Array.isArray(iv.billingLines) ? iv.billingLines : [];
    for (const line of lines) {
      if (line && typeof line === "object") {
        const l = line as { unitPriceCents?: number; quantity?: number };
        revenueCents += Math.round((l.unitPriceCents ?? 0) * (l.quantity ?? 1));
      }
    }
  }

  const lowStock = stockRows.filter(
      (s) =>
        typeof s.quantity === "number" &&
        typeof s.alertThreshold === "number" &&
        (s.quantity as number) <= (s.alertThreshold as number),
    );

  return {
    interventionCount: interventions.length,
    byStatus,
    urgentOpen,
    estimatedRevenueEur: Math.round(revenueCents) / 100,
    technicianCount: techSnap.size,
    lowStockCount: lowStock.length,
    lowStock: lowStock.slice(0, 10).map((s) => ({
      id: s.id,
      name: s.name,
      quantity: s.quantity,
      alertThreshold: s.alertThreshold,
    })),
  };
}

async function listInterventions(companyId: string, input: Record<string, unknown>) {
  const limit = Math.min(50, Math.max(1, Number(input.limit) || 20));
  let rows = await fetchInterventionsForCompany(db(), companyId, 120);

  const status = typeof input.status === "string" ? input.status.trim() : "";
  if (status) rows = rows.filter((r) => String(r.status) === status);
  if (input.urgentOnly === true) rows = rows.filter((r) => Boolean(r.urgency));
  const scheduledDate = typeof input.scheduledDate === "string" ? input.scheduledDate.trim() : "";
  if (scheduledDate) {
    rows = rows.filter(
      (r) => r.scheduledDate === scheduledDate || r.requestedDate === scheduledDate,
    );
  }
  const search = typeof input.search === "string" ? input.search.toLowerCase().trim() : "";
  if (search) {
    rows = rows.filter((r) => {
      const blob = [clientLabel(r), r.address, r.problem, r.title, r.id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(search);
    });
  }

  return rows.slice(0, limit).map((r) => ({
    id: r.id,
    status: r.status,
    client: clientLabel(r),
    address: r.address,
    problem: r.problem || r.title,
    scheduledDate: r.scheduledDate || r.requestedDate,
    scheduledTime: r.scheduledTime || r.requestedTime,
    urgency: Boolean(r.urgency),
    paymentStatus: r.paymentStatus ?? null,
    assignedTechnicianUid: r.assignedTechnicianUid ?? null,
  }));
}

async function getInterventionDetail(companyId: string, interventionId: string) {
  if (!interventionId.trim()) throw new Error("interventionId requis");
  const ref = db().collection("interventions").doc(interventionId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("Intervention introuvable");
  const data = doc.data()!;
  if (String(data.companyId || "") !== companyId) {
    throw new Error("Accès refusé à ce dossier (autre société)");
  }

  const [quotesSnap, ordersSnap, timelineSnap] = await Promise.all([
    db()
      .collection("companies")
      .doc(companyId)
      .collection("quotes")
      .where("interventionId", "==", interventionId)
      .limit(10)
      .get()
      .catch(() => null),
    db()
      .collection("material_orders")
      .where("interventionId", "==", interventionId)
      .limit(10)
      .get()
      .catch(() => null),
    ref.collection("timeline_events").orderBy("createdAt", "desc").limit(8).get().catch(() => null),
  ]);

  const billingLines = normalizeBillingLinesFromFirestore(data.billingLines);
  const clientName = clientLabel(data);

  return {
    id: doc.id,
    status: data.status,
    clientName,
    address: data.address ?? null,
    problem: data.problem ?? data.title ?? null,
    scheduledDate: data.scheduledDate ?? data.requestedDate ?? null,
    scheduledTime: data.scheduledTime ?? data.requestedTime ?? null,
    paymentStatus: data.paymentStatus ?? null,
    invoiceAmountCents: data.invoiceAmountCents ?? billingLinesTotalCents(billingLines),
    billingLines,
    assignedTechnicianUid: data.assignedTechnicianUid ?? null,
    clientPhone: data.clientPhone ?? data.phone ?? null,
    clientEmail: data.clientEmail ?? data.email ?? null,
    quotes:
      quotesSnap?.docs.map((d) => {
        const q = d.data();
        return { id: d.id, status: q.status, totalCents: q.totalCents };
      }) ?? [],
    materialOrders:
      ordersSnap?.docs.map((d) => {
        const o = d.data();
        return { id: d.id, status: o.status };
      }) ?? [],
    recentTimeline:
      timelineSnap?.docs.map((d) => {
        const e = d.data();
        return {
          id: d.id,
          type: e.type,
          createdAt: e.createdAt,
          content: String(e.content ?? "").slice(0, 200),
        };
      }) ?? [],
  };
}

async function listClients(companyId: string, input: Record<string, unknown>) {
  const limit = Math.min(50, Math.max(1, Number(input.limit) || 25));
  let rows = await fetchAllClientsForCompany(db(), companyId);

  const search = typeof input.search === "string" ? input.search.trim() : "";
  if (search) {
    rows = rows.filter((r) => matchesWorkspaceQuery(clientSearchHaystack(r), search));
  }

  return rows.slice(0, limit).map(formatClientRow);
}

async function getClientDetail(companyId: string, clientId: string) {
  const cid = clientId.trim();
  if (!cid) throw new Error("clientId requis");

  const clientRef = db().collection("clients").doc(cid);
  const clientDoc = await clientRef.get();
  if (!clientDoc.exists) throw new Error("Client CRM introuvable");
  const clientData = clientDoc.data()!;
  if (String(clientData.companyId || "") !== companyId) {
    throw new Error("Accès refusé (autre société)");
  }

  const clientRow = formatClientRow({ id: clientDoc.id, ...clientData });

  const [sitesSnap, interventions] = await Promise.all([
    db()
      .collection("sites")
      .where("companyId", "==", companyId)
      .where("clientId", "==", cid)
      .limit(30)
      .get()
      .catch(() => null),
    fetchInterventionsForCompany(db(), companyId, 200),
  ]);

  const linkedInterventions = interventions
    .filter((iv) => String(iv.clientId || "") === cid)
    .slice(0, 40)
    .map((r) => ({
      id: r.id,
      status: r.status,
      address: r.address ?? null,
      problem: r.problem || r.title || null,
      scheduledDate: r.scheduledDate || r.requestedDate || null,
    }));

  return {
    client: clientRow,
    sites:
      sitesSnap?.docs.map((d) => {
        const s = d.data();
        return {
          id: d.id,
          label: s.label ?? null,
          address: s.address ?? null,
        };
      }) ?? [],
    interventions: linkedInterventions,
  };
}

async function listQuotes(companyId: string, input: Record<string, unknown>) {
  const limit = Math.min(40, Math.max(1, Number(input.limit) || 20));
  const col = db().collection("companies").doc(companyId).collection("quotes");
  const interventionId = typeof input.interventionId === "string" ? input.interventionId.trim() : "";

  const snap = interventionId
    ? await col.where("interventionId", "==", interventionId).limit(limit).get()
    : await col.limit(Math.max(limit, 40)).get();

  let rows = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown>))
    .sort((a, b) => parseCreatedAtMs(b) - parseCreatedAtMs(a));
  const status = typeof input.status === "string" ? input.status.trim() : "";
  if (status) rows = rows.filter((r) => String(r.status) === status);

  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    clientName: r.clientName,
    totalCents: r.totalCents,
    interventionId: r.interventionId,
    expiresAt: r.expiresAt,
  }));
}

async function listTechnicians(companyId: string) {
  const snap = await db().collection("technicians").where("companyId", "==", companyId).get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      uid: data.uid ?? d.id,
      name: data.name || data.displayName || data.email || d.id,
      status: data.status ?? null,
      skills: data.skills ?? [],
    };
  });
}

async function listStockAlerts(companyId: string) {
  const items = await fetchStockDocs(companyId);
  return items
    .filter(
      (s) =>
        typeof s["quantity"] === "number" &&
        typeof s["alertThreshold"] === "number" &&
        (s["quantity"] as number) <= (s["alertThreshold"] as number),
    )
    .map((s) => ({
      id: s["id"],
      name: s["name"],
      quantity: s["quantity"],
      alertThreshold: s["alertThreshold"],
      unit: s["unit"] ?? null,
    }));
}

async function listMaterialOrders(interventionId: string, input: Record<string, unknown>) {
  if (!interventionId.trim()) throw new Error("interventionId requis");
  const limit = Math.min(20, Math.max(1, Number(input.limit) || 10));
  const snap = await db()
    .collection("material_orders")
    .where("interventionId", "==", interventionId)
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown>));
}

async function listSupplierOrders(companyId: string, input: Record<string, unknown>) {
  const limit = Math.min(30, Math.max(1, Number(input.limit) || 15));
  let query = db()
    .collection("companies")
    .doc(companyId)
    .collection("supplierOrders")
    .orderBy("createdAt", "desc")
    .limit(limit);
  if (typeof input.supplierId === "string" && input.supplierId.trim()) {
    query = query.where("supplierId", "==", input.supplierId.trim()) as typeof query;
  }
  if (typeof input.status === "string" && input.status.trim()) {
    query = query.where("status", "==", input.status.trim()) as typeof query;
  }
  const snap = await query.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown>));
}

async function listInboxNotifications(ctx: ChatbotToolContext, input: Record<string, unknown>) {
  const limit = Math.min(40, Math.max(1, Number(input.limit) || 20));
  const unreadOnly = input.unreadOnly === true;
  const snap = await db()
    .collection("companies")
    .doc(ctx.companyId)
    .collection("inboxNotifications")
    .where("recipientUid", "==", ctx.actorUid)
    .limit(60)
    .get();

  let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown>));
  if (unreadOnly) rows = rows.filter((r) => r.read !== true);
  rows.sort((a, b) => parseIsoMs(b.createdAt) - parseIsoMs(a.createdAt));

  return rows.slice(0, limit).map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    body: typeof r.body === "string" ? r.body.slice(0, 280) : r.body,
    read: Boolean(r.read),
    interventionId: r.interventionId ?? null,
    createdAt: r.createdAt ?? null,
  }));
}

async function listInterventionEmails(interventionId: string, input: Record<string, unknown>) {
  const id = interventionId.trim();
  if (!id) throw new Error("interventionId requis");
  const limit = Math.min(30, Math.max(1, Number(input.limit) || 15));

  const snap = await db()
    .collection("intervention_emails")
    .where("interventionId", "==", id)
    .limit(50)
    .get();

  const rows = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown>))
    .sort((a, b) => parseIsoMs(a.createdAt) - parseIsoMs(b.createdAt));

  return rows.slice(0, limit).map((r) => ({
    id: r.id,
    direction: r.direction ?? r.type ?? null,
    subject: r.subject ?? null,
    from: r.from ?? r.sender ?? null,
    snippet:
      typeof r.body === "string"
        ? r.body.slice(0, 200)
        : typeof r.snippet === "string"
          ? r.snippet.slice(0, 200)
          : null,
    createdAt: r.createdAt ?? null,
  }));
}

async function getInterventionBilling(companyId: string, interventionId: string) {
  const id = interventionId.trim();
  if (!id) throw new Error("interventionId requis");
  const doc = await assertInterventionAccess(companyId, id);
  const data = doc.data()!;
  const lines = Array.isArray(data.billingLines) ? data.billingLines : [];
  let totalCents = 0;
  for (const line of lines) {
    if (line && typeof line === "object") {
      const l = line as { unitPriceCents?: number; quantity?: number };
      totalCents += Math.round((l.unitPriceCents ?? 0) * (l.quantity ?? 1));
    }
  }
  if (typeof data.invoiceAmountCents === "number") totalCents = data.invoiceAmountCents;

  return {
    interventionId: id,
    clientName: clientLabel(data),
    paymentStatus: data.paymentStatus ?? null,
    invoiceAmountCents: data.invoiceAmountCents ?? totalCents,
    totalEur: Math.round(totalCents) / 100,
    billingLines: lines,
    invoicePdfUrl: data.invoicePdfUrl ?? data.invoicePdfStoragePath ?? null,
    stripePaymentLinkUrl: data.stripePaymentLinkUrl ?? data.paymentLinkUrl ?? null,
  };
}

async function listPortalChat(companyId: string, input: Record<string, unknown>) {
  const interventionId = String(input.interventionId || "").trim();
  const limit = Math.min(50, Math.max(1, Number(input.limit) || 25));
  const col = db().collection("portal_ivana_chat_messages");

  const snap = interventionId
    ? await col.where("interventionId", "==", interventionId).limit(80).get()
    : await col.where("companyId", "==", companyId).limit(80).get();

  const rows = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown>))
    .sort((a, b) => parseIsoMs(a.createdAt) - parseIsoMs(b.createdAt));

  return rows.slice(-limit).map((r) => ({
    id: r.id,
    role: r.role,
    body: typeof r.body === "string" ? r.body.slice(0, 400) : "",
    interventionId: r.interventionId ?? null,
    createdAt: r.createdAt ?? null,
  }));
}

async function statistiquesPeriode(companyId: string, input: Record<string, unknown>) {
  const dateFrom = String(input.dateFrom || "").trim();
  const dateTo = String(input.dateTo || "").trim();
  if (!dateFrom || !dateTo) throw new Error("dateFrom et dateTo requis (AAAA-MM-JJ)");

  const interventions = await fetchInterventionsForCompany(db(), companyId, 500);

  const inRange = interventions.filter((iv) => {
    const d = String(iv.createdAt || iv.scheduledDate || iv.requestedDate || "").slice(0, 10);
    return d >= dateFrom && d <= dateTo;
  });

  const byStatus: Record<string, number> = {};
  let totalBilledCents = 0;
  let paidCents = 0;
  let unpaidCount = 0;

  for (const iv of inRange) {
    const st = String(iv.status || "pending");
    byStatus[st] = (byStatus[st] ?? 0) + 1;
    const amt = typeof iv.invoiceAmountCents === "number" ? iv.invoiceAmountCents : 0;
    const lines = Array.isArray(iv.billingLines) ? iv.billingLines : [];
    let lineCents = 0;
    for (const line of lines) {
      if (line && typeof line === "object") {
        const l = line as { unitPriceCents?: number; quantity?: number };
        lineCents += Math.round((l.unitPriceCents ?? 0) * (l.quantity ?? 1));
      }
    }
    const effective = amt || lineCents;
    totalBilledCents += effective;
    if (iv.paymentStatus === "paid") paidCents += effective;
    else if (effective > 0) unpaidCount += 1;
  }

  return {
    period: { from: dateFrom, to: dateTo },
    interventionCount: inRange.length,
    byStatus,
    totalBilledEur: Math.round(totalBilledCents) / 100,
    paidEur: Math.round(paidCents) / 100,
    unpaidEur: Math.round(totalBilledCents - paidCents) / 100,
    unpaidCount,
  };
}

async function updateInterventionStatus(ctx: ChatbotToolContext, input: Record<string, unknown>) {
  const interventionId = String(input.interventionId || "").trim();
  const status = String(input.status || "").trim();
  if (!interventionId || !status) throw new Error("interventionId et status requis");

  await assertInterventionAccess(ctx.companyId, interventionId);
  const now = new Date().toISOString();
  await db()
    .collection("interventions")
    .doc(interventionId)
    .update({ status, statusUpdatedAt: now });

  const note = typeof input.note === "string" ? input.note.trim() : "";
  if (note) {
    await db()
      .collection("interventions")
      .doc(interventionId)
      .collection("timeline_events")
      .add({
        interventionId,
        type: "comment",
        content: `[Chatbot] ${note}`,
        visibility: "internal",
        createdAt: now,
        createdByUid: ctx.actorUid,
        companyId: ctx.companyId,
      });
  }

  return { ok: true, interventionId, status };
}

async function assignTechnician(ctx: ChatbotToolContext, input: Record<string, unknown>) {
  const interventionId = String(input.interventionId || "").trim();
  const technicianUid = String(input.technicianUid || "").trim();
  if (!interventionId || !technicianUid) throw new Error("interventionId et technicianUid requis");

  const doc = await assertInterventionAccess(ctx.companyId, interventionId);
  const data = doc.data()!;
  const scheduledDate = String(input.scheduledDate || "").trim();
  const scheduledTime = String(input.scheduledTime || "").trim();
  const patch = buildAssignInterventionToTechnicianUpdate(
    data as Parameters<typeof buildAssignInterventionToTechnicianUpdate>[0],
    technicianUid,
    new Date(),
    scheduledDate && scheduledTime ? { scheduledDate, scheduledTime } : undefined,
  );

  await db().collection("interventions").doc(interventionId).update({
    ...patch,
    statusUpdatedAt: new Date().toISOString(),
  });

  return { ok: true, interventionId, ...patch };
}

async function updateSchedule(ctx: ChatbotToolContext, input: Record<string, unknown>) {
  const interventionId = String(input.interventionId || "").trim();
  const scheduledDate = String(input.scheduledDate || "").trim();
  const scheduledTime = String(input.scheduledTime || "").trim();
  if (!interventionId || !scheduledDate || !scheduledTime) {
    throw new Error("interventionId, scheduledDate et scheduledTime requis");
  }

  await assertInterventionAccess(ctx.companyId, interventionId);
  await db().collection("interventions").doc(interventionId).update({
    scheduledDate,
    scheduledTime,
    statusUpdatedAt: new Date().toISOString(),
  });

  return { ok: true, interventionId, scheduledDate, scheduledTime };
}

/** Vérifie l'accès dossier ; la PWA génère le PDF (route document-pdf). */
async function focusInterventionDocument(ctx: ChatbotToolContext, input: Record<string, unknown>) {
  const interventionId = String(input.interventionId || "").trim();
  const documentType = String(input.documentType || "invoice").trim();
  if (!interventionId) throw new Error("interventionId requis");
  if (!isChatbotDocumentKind(documentType)) {
    throw new Error("documentType invalide (quote | invoice | report)");
  }
  await assertInterventionAccess(ctx.companyId, interventionId);
  return {
    ok: true,
    interventionId,
    documentType,
  };
}

async function saveInterventionBilling(
  ctx: ChatbotToolContext,
  interventionId: string,
  data: Record<string, unknown>,
  billingLines: ChatbotBillingLine[],
  previewDocumentType: ChatbotDocumentKind,
  clientNameOverride?: string,
) {
  const totalCents = billingLinesTotalCents(billingLines);
  const namePatch = clientNameFirestorePatchIfMissing(data, clientNameOverride);

  await db()
    .collection("interventions")
    .doc(interventionId)
    .update({
      billingLines,
      invoiceAmountCents: totalCents,
      statusUpdatedAt: new Date().toISOString(),
      ...(namePatch ?? {}),
    });

  const clientName =
    namePatch?.clientName ??
    clientNameOverride ??
    (typeof data.clientName === "string" && data.clientName.trim()
      ? data.clientName.trim()
      : clientLabel(data));

  return {
    ok: true,
    interventionId,
    clientName,
    totalEur: totalCents / 100,
    previewDocumentType,
    documentType: previewDocumentType,
    message: "Facturation enregistrée.",
  };
}

async function patchInterventionBilling(ctx: ChatbotToolContext, input: Record<string, unknown>) {
  const interventionId = String(input.interventionId || "").trim();
  if (!interventionId) throw new Error("interventionId requis");

  const unitPriceCents = parseUnitPriceCents(input);
  const hasPrice = unitPriceCents != null;
  const hasDesc = typeof input.description === "string" && input.description.trim();
  const hasQty = input.quantity != null && Number.isFinite(Number(input.quantity));
  const hasClient = typeof input.clientName === "string" && input.clientName.trim();

  if (!hasPrice && !hasDesc && !hasQty && !hasClient) {
    throw new Error(
      "Précisez au moins unitPriceEur, description, quantity ou clientName pour le patch.",
    );
  }

  const doc = await assertInterventionAccess(ctx.companyId, interventionId);
  const data = doc.data()!;
  const existing = normalizeBillingLinesFromFirestore(data.billingLines);
  const lineIndex = Math.max(0, Number(input.lineIndex) || 0);

  const billingLines = applyBillingLinePatch(existing, {
    lineIndex,
    unitPriceCents: hasPrice ? unitPriceCents : null,
    quantity: hasQty ? Number(input.quantity) : undefined,
    description: hasDesc ? String(input.description).trim() : undefined,
  });

  let previewDocumentType: ChatbotDocumentKind = "invoice";
  const pdt = String(input.previewDocumentType || "invoice").trim();
  if (isChatbotDocumentKind(pdt) && pdt !== "report") previewDocumentType = pdt;

  const saved = await saveInterventionBilling(
    ctx,
    interventionId,
    data,
    billingLines,
    previewDocumentType,
    hasClient ? String(input.clientName).trim() : undefined,
  );
  return { ...saved, linePatched: lineIndex };
}

/** Ajoute des lignes à la facture existante (sans remplacer). */
async function appendInterventionBillingLines(
  ctx: ChatbotToolContext,
  input: Record<string, unknown>,
) {
  const interventionId = String(input.interventionId || "").trim();
  if (!interventionId) throw new Error("interventionId requis");

  const rawLines = input.lines;
  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    throw new Error("lines requis (au moins une ligne)");
  }

  const newLines = rawLines.map((row, i) => {
    if (!row || typeof row !== "object") throw new Error(`Ligne ${i + 1} invalide`);
    const l = row as Record<string, unknown>;
    const description = String(l.description || "").trim();
    const quantity = l.quantity != null ? Number(l.quantity) : 1;
    const unitPriceCents = parseUnitPriceCents(l);
    if (!description) throw new Error(`Ligne ${i + 1} : description requise`);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(`Ligne ${i + 1} : quantité invalide`);
    }
    if (unitPriceCents == null || unitPriceCents < 0) {
      throw new Error(`Ligne ${i + 1} : prix invalide`);
    }
    return { description, quantity, unitPriceCents };
  });

  const doc = await assertInterventionAccess(ctx.companyId, interventionId);
  const data = doc.data()!;
  const existing = normalizeBillingLinesFromFirestore(data.billingLines);
  const billingLines = [...existing, ...newLines];

  let previewDocumentType: ChatbotDocumentKind = "invoice";
  const pdt = String(input.previewDocumentType || "invoice").trim();
  if (isChatbotDocumentKind(pdt) && pdt !== "report") previewDocumentType = pdt;

  const saved = await saveInterventionBilling(
    ctx,
    interventionId,
    data,
    billingLines,
    previewDocumentType,
  );
  return {
    ...saved,
    linesAdded: newLines.length,
    addedDescriptions: newLines.map((l) => l.description),
  };
}

async function updateInterventionBilling(ctx: ChatbotToolContext, input: Record<string, unknown>) {
  const interventionId = String(input.interventionId || "").trim();
  if (!interventionId) throw new Error("interventionId requis");

  const rawLines = input.billingLines;
  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    throw new Error("billingLines requis (au moins une ligne)");
  }

  const billingLines = rawLines.map((row, i) => {
    if (!row || typeof row !== "object") throw new Error(`Ligne ${i + 1} invalide`);
    const l = row as Record<string, unknown>;
    const description = String(l.description || "").trim();
    const quantity = Number(l.quantity);
    const unitPriceCents = parseUnitPriceCents(l) ?? Math.round(Number(l.unitPriceCents));
    if (!description) throw new Error(`Ligne ${i + 1} : description requise`);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(`Ligne ${i + 1} : quantité invalide`);
    }
    if (!Number.isFinite(unitPriceCents) || unitPriceCents < 0) {
      throw new Error(`Ligne ${i + 1} : prix unitaire invalide`);
    }
    return {
      description,
      quantity,
      unitPriceCents,
      ...(typeof l.reference === "string" && l.reference.trim()
        ? { reference: l.reference.trim() }
        : {}),
    };
  });

  const doc = await assertInterventionAccess(ctx.companyId, interventionId);
  const data = doc.data()!;

  let previewDocumentType: ChatbotDocumentKind = "invoice";
  const pdt = String(input.previewDocumentType || "invoice").trim();
  if (isChatbotDocumentKind(pdt) && pdt !== "report") previewDocumentType = pdt;

  const clientOverride =
    typeof input.clientName === "string" && input.clientName.trim()
      ? input.clientName.trim()
      : undefined;

  const saved = await saveInterventionBilling(
    ctx,
    interventionId,
    data,
    billingLines,
    previewDocumentType,
    clientOverride,
  );

  if (typeof input.clientAddress === "string" && input.clientAddress.trim()) {
    await db()
      .collection("interventions")
      .doc(interventionId)
      .update({ address: input.clientAddress.trim() });
  }

  return saved;
}

async function sendInterventionEmailFromChatbot(
  ctx: ChatbotToolContext,
  input: Record<string, unknown>,
) {
  const interventionId = String(input.interventionId || "").trim();
  const to = String(input.to || "").trim();
  const subject = String(input.subject || "").trim();
  const bodyText = String(input.bodyText || "").trim();
  if (!interventionId || !to || !subject || !bodyText) {
    throw new Error("interventionId, to, subject et bodyText requis");
  }

  const doc = await assertInterventionAccess(ctx.companyId, interventionId);
  const data = doc.data()!;

  const attachDocumentType = resolveSendInterventionEmailAttachType(input, ctx.lastUserText);
  input.attachDocumentType = attachDocumentType;

  const result = await sendInterventionEmail({
    interventionId,
    companyId: ctx.companyId,
    to,
    subject,
    bodyText,
    inReplyTo: typeof input.inReplyTo === "string" ? input.inReplyTo.trim() : undefined,
    sentByUid: ctx.actorUid,
    sentVia: "chatbot",
    attachDocumentType,
  });

  if (!result.ok) {
    throw new Error(result.error);
  }

  const saved = await persistInterventionClientEmail(
    db(),
    ctx.companyId,
    interventionId,
    to,
    data,
  );
  invalidateInterventionCache(ctx.companyId);

  return {
    ok: true,
    interventionId,
    to,
    subject,
    messageId: result.messageId,
    attachDocumentType,
    attachmentFilename: result.attachmentFilename ?? null,
    emailSaved: saved.savedOnIntervention || saved.savedOnClient,
    savedOnCrm: saved.savedOnClient,
  };
}

async function saveClientEmailFromChatbot(ctx: ChatbotToolContext, input: Record<string, unknown>) {
  const interventionId = String(input.interventionId || "").trim();
  const email = String(input.email || input.to || "").trim();
  if (!interventionId) throw new Error("interventionId requis");
  if (!email) throw new Error("email requis");

  const doc = await assertInterventionAccess(ctx.companyId, interventionId);
  const saved = await persistInterventionClientEmail(
    db(),
    ctx.companyId,
    interventionId,
    email,
    doc.data()!,
  );
  invalidateInterventionCache(ctx.companyId);

  return {
    ok: true,
    interventionId,
    email: saved.email,
    savedOnIntervention: saved.savedOnIntervention,
    savedOnClient: saved.savedOnClient,
    clientName: clientLabel(doc.data()!),
  };
}

async function addTimelineComment(ctx: ChatbotToolContext, input: Record<string, unknown>) {
  const interventionId = String(input.interventionId || "").trim();
  const content = String(input.content || "").trim();
  if (!interventionId || !content) throw new Error("interventionId et content requis");

  await assertInterventionAccess(ctx.companyId, interventionId);
  const now = new Date().toISOString();
  const ref = await db()
    .collection("interventions")
    .doc(interventionId)
    .collection("timeline_events")
    .add({
      interventionId,
      type: "comment",
      content: `[Chatbot] ${content}`,
      visibility: "internal",
      createdAt: now,
      createdByUid: ctx.actorUid,
      companyId: ctx.companyId,
    });

  return { ok: true, eventId: ref.id };
}

async function assertInterventionAccess(companyId: string, interventionId: string) {
  const ref = db().collection("interventions").doc(interventionId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("Intervention introuvable");
  if (String(doc.data()?.companyId || "") !== companyId) {
    throw new Error("Accès refusé (autre société)");
  }
  return doc;
}


