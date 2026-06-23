import {
  fetchInterventionsForCompany,
  parseCreatedAtMs,
} from "@/features/chatbot/chatbot-intervention-source";
import {
  normalizeBillingLinesFromFirestore,
  billingLinesTotalCents,
} from "@/features/chatbot/chatbot-billing";
import { assertInterventionAccess, clientLabel, db } from "@/features/chatbot/chatbot-executor-db";
import { fetchStockDocs } from "@/features/chatbot/chatbot-executor-stock-queries";

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
