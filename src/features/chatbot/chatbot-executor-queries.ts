import * as admin from "firebase-admin";
import {
  fetchInterventionsForCompany,
  parseCreatedAtMs,
} from "@/features/chatbot/chatbot-intervention-source";
import {
  clientSearchHaystack,
  fetchAllClientsForCompany,
  formatClientRow,
  matchesWorkspaceQuery,
} from "@/features/chatbot/chatbot-workspace-search";
import {
  normalizeBillingLinesFromFirestore,
  billingLinesTotalCents,
} from "@/features/chatbot/chatbot-billing";
import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";

export function db(): admin.firestore.Firestore {
  if (!admin.apps.length) {
    throw new Error("Firebase Admin non initialisé");
  }
  return admin.firestore();
}

export function parseIsoMs(raw: unknown): number {
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

export async function fetchStockDocs(companyId: string): Promise<Record<string, unknown>[]> {
  const firestore = db();
  let snap = await firestore
    .collection("stockItems")
    .where("companyId", "==", companyId)
    .limit(80)
    .get();
  if (snap.empty) {
    snap = await firestore
      .collection("stock_items")
      .where("companyId", "==", companyId)
      .limit(80)
      .get();
  }
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>);
}

export function clientLabel(data: Record<string, unknown>): string {
  const parts = [data.clientFirstName, data.clientLastName].filter(Boolean).join(" ").trim();
  if (parts) return parts;
  if (typeof data.clientName === "string" && data.clientName.trim()) return data.clientName.trim();
  if (typeof data.clientCompanyName === "string" && data.clientCompanyName.trim()) {
    return data.clientCompanyName.trim();
  }
  return String(data.title || "Client");
}

export async function assertInterventionAccess(companyId: string, interventionId: string) {
  const ref = db().collection("interventions").doc(interventionId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("Intervention introuvable");
  if (String(doc.data()?.companyId || "") !== companyId) {
    throw new Error("Accès refusé (autre société)");
  }
  return doc;
}

export async function getWorkspaceSummary(companyId: string) {
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
      (s.quantity as number) <= (s.alertThreshold as number)
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

export async function listInterventions(companyId: string, input: Record<string, unknown>) {
  const limit = Math.min(50, Math.max(1, Number(input.limit) || 20));
  let rows = await fetchInterventionsForCompany(db(), companyId, 120);

  const status = typeof input.status === "string" ? input.status.trim() : "";
  if (status) rows = rows.filter((r) => String(r.status) === status);
  if (input.urgentOnly === true) rows = rows.filter((r) => Boolean(r.urgency));
  const scheduledDate = typeof input.scheduledDate === "string" ? input.scheduledDate.trim() : "";
  if (scheduledDate) {
    rows = rows.filter(
      (r) => r.scheduledDate === scheduledDate || r.requestedDate === scheduledDate
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

export async function getInterventionDetail(companyId: string, interventionId: string) {
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
    ref
      .collection("timeline_events")
      .orderBy("createdAt", "desc")
      .limit(8)
      .get()
      .catch(() => null),
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

export async function listClients(companyId: string, input: Record<string, unknown>) {
  const limit = Math.min(50, Math.max(1, Number(input.limit) || 25));
  let rows = await fetchAllClientsForCompany(db(), companyId);

  const search = typeof input.search === "string" ? input.search.trim() : "";
  if (search) {
    rows = rows.filter((r) => matchesWorkspaceQuery(clientSearchHaystack(r), search));
  }

  return rows.slice(0, limit).map(formatClientRow);
}

export async function getClientDetail(companyId: string, clientId: string) {
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

export async function listQuotes(companyId: string, input: Record<string, unknown>) {
  const limit = Math.min(40, Math.max(1, Number(input.limit) || 20));
  const col = db().collection("companies").doc(companyId).collection("quotes");
  const interventionId =
    typeof input.interventionId === "string" ? input.interventionId.trim() : "";

  const snap = interventionId
    ? await col.where("interventionId", "==", interventionId).limit(limit).get()
    : await col.limit(Math.max(limit, 40)).get();

  let rows = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>)
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

export async function listTechnicians(companyId: string) {
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

export async function listStockAlerts(companyId: string) {
  const items = await fetchStockDocs(companyId);
  return items
    .filter(
      (s) =>
        typeof s["quantity"] === "number" &&
        typeof s["alertThreshold"] === "number" &&
        (s["quantity"] as number) <= (s["alertThreshold"] as number)
    )
    .map((s) => ({
      id: s["id"],
      name: s["name"],
      quantity: s["quantity"],
      alertThreshold: s["alertThreshold"],
      unit: s["unit"] ?? null,
    }));
}

export async function listMaterialOrders(interventionId: string, input: Record<string, unknown>) {
  if (!interventionId.trim()) throw new Error("interventionId requis");
  const limit = Math.min(20, Math.max(1, Number(input.limit) || 10));
  const snap = await db()
    .collection("material_orders")
    .where("interventionId", "==", interventionId)
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>);
}

export async function listCompanyMaterialOrders(companyId: string, input: Record<string, unknown>) {
  const limit = Math.min(40, Math.max(1, Number(input.limit) || 20));
  const statusFilter =
    typeof input.status === "string" && input.status.trim() ? input.status.trim() : null;
  const snap = await db()
    .collection("material_orders")
    .where("companyId", "==", companyId)
    .limit(80)
    .get();
  let rows = snap.docs.map((d) => {
    const data = d.data();
    const parts = Array.isArray(data.partsRequested) ? data.partsRequested : [];
    const first = parts[0] as { description?: string } | undefined;
    return {
      id: d.id,
      interventionId: data.interventionId ?? null,
      status: data.status ?? null,
      urgency: data.urgency ?? null,
      summary: first?.description?.trim() || "Bon matériel",
      createdAt: data.createdAt ?? null,
    };
  });
  if (statusFilter) rows = rows.filter((r) => r.status === statusFilter);
  rows.sort((a, b) => parseIsoMs(b.createdAt) - parseIsoMs(a.createdAt));
  return { count: rows.length, orders: rows.slice(0, limit) };
}

export async function listSupplierOrders(companyId: string, input: Record<string, unknown>) {
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
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>);
}

export async function listInboxNotifications(
  ctx: ChatbotToolContext,
  input: Record<string, unknown>
) {
  const limit = Math.min(40, Math.max(1, Number(input.limit) || 20));
  const unreadOnly = input.unreadOnly === true;
  const snap = await db()
    .collection("companies")
    .doc(ctx.companyId)
    .collection("inboxNotifications")
    .where("recipientUid", "==", ctx.actorUid)
    .limit(60)
    .get();

  let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>);
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

export async function listInterventionEmails(
  interventionId: string,
  input: Record<string, unknown>
) {
  const id = interventionId.trim();
  if (!id) throw new Error("interventionId requis");
  const limit = Math.min(30, Math.max(1, Number(input.limit) || 15));

  const snap = await db()
    .collection("intervention_emails")
    .where("interventionId", "==", id)
    .limit(50)
    .get();

  const rows = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>)
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

export async function listPortalChat(companyId: string, input: Record<string, unknown>) {
  const interventionId = String(input.interventionId || "").trim();
  const limit = Math.min(50, Math.max(1, Number(input.limit) || 25));
  const col = db().collection("portal_ivana_chat_messages");

  const snap = interventionId
    ? await col.where("interventionId", "==", interventionId).limit(80).get()
    : await col.where("companyId", "==", companyId).limit(80).get();

  const rows = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>)
    .sort((a, b) => parseIsoMs(a.createdAt) - parseIsoMs(b.createdAt));

  return rows.slice(-limit).map((r) => ({
    id: r.id,
    role: r.role,
    body: typeof r.body === "string" ? r.body.slice(0, 400) : "",
    interventionId: r.interventionId ?? null,
    createdAt: r.createdAt ?? null,
  }));
}

export async function statistiquesPeriode(companyId: string, input: Record<string, unknown>) {
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

export async function getInterventionBilling(companyId: string, interventionId: string) {
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
