import type { Intervention } from "@/features/interventions/types";
import type { MaterialOrderDoc } from "@/features/materials/materialOrderFirestore";
import type { SupplierOrder } from "@/features/suppliers/types";
import type { InterventionEmailDoc } from "@/features/emails/interventionEmailFirestore";
import type { CompanyCommissionAuditRow } from "@/features/commissions/commissionFirestore";
import type { CrmActivityEvent } from "./crmActivityTypes";
import { parseTs } from "./crmActivityLog";

function interventionClientName(iv: Intervention): string | undefined {
  return (
    iv.clientCompanyName ??
    iv.clientName ??
    (iv.clientFirstName || iv.clientLastName
      ? [iv.clientFirstName, iv.clientLastName].filter(Boolean).join(" ")
      : undefined) ??
    undefined
  );
}

export function synthesizeInterventionEvents(interventions: Intervention[]): CrmActivityEvent[] {
  const events: CrmActivityEvent[] = [];

  for (const iv of interventions) {
    const clientName = interventionClientName(iv);
    const base = {
      interventionId: iv.id,
      interventionTitle: iv.title,
      clientName,
      address: iv.address,
    };

    const createdTs = parseTs(iv.createdAt);
    if (createdTs) {
      events.push({ id: `${iv.id}:created`, type: "intervention_created", ts: createdTs, ...base });
    }

    const assignedTs = parseTs(iv.technicianAcceptedAt);
    if (assignedTs && iv.assignedTechnicianUid) {
      events.push({
        id: `${iv.id}:assigned`,
        type: "intervention_assigned",
        ts: assignedTs,
        technicianUid: iv.assignedTechnicianUid,
        ...base,
      });
    }

    const completedTs = parseTs(iv.completedAt);
    if (completedTs) {
      events.push({ id: `${iv.id}:completed`, type: "intervention_completed", ts: completedTs, ...base });
    }

    const invoicedTs =
      parseTs(iv.invoicedAt) ||
      (iv.status === "invoiced" || iv.invoicePdfUrl
        ? parseTs(iv.statusUpdatedAt) || parseTs(iv.completedAt)
        : 0);
    if (invoicedTs) {
      events.push({
        id: `${iv.id}:invoiced`,
        type: "intervention_invoiced",
        ts: invoicedTs,
        statusAfter: "invoiced",
        ...base,
      });
    }
  }

  return events;
}

/** Facturation sur dossier (lignes + statusUpdatedAt) — visible même sans entrée journal. */
export function synthesizeInterventionBillingEvents(
  interventions: Intervention[],
): CrmActivityEvent[] {
  const events: CrmActivityEvent[] = [];

  for (const iv of interventions) {
    const lines = iv.billingLines;
    if (!Array.isArray(lines) || lines.length === 0) continue;

    const ts = parseTs(iv.statusUpdatedAt) || parseTs(iv.invoicedAt) || parseTs(iv.completedAt);
    if (!ts) continue;

    const totalCents =
      typeof iv.invoiceAmountCents === "number" && iv.invoiceAmountCents > 0
        ? Math.round(iv.invoiceAmountCents)
        : lines.reduce(
            (s, l) => s + Math.round((l.unitPriceCents ?? 0) * (l.quantity ?? 1)),
            0,
          );

    const clientName = interventionClientName(iv);
    events.push({
      id: `${iv.id}:billing-snapshot`,
      type: "intervention_billing_updated",
      ts,
      interventionId: iv.id,
      interventionTitle: iv.title,
      clientName,
      address: iv.address,
      note: `Facture · ${lines.length} ligne(s) · ${Math.round(totalCents) / 100} €`,
    });
  }

  return events;
}

/** Refus terrain / retour file Demandes (champs dénormalisés — rétroactif). */
export function synthesizeInterventionLifecycleEvents(
  interventions: Intervention[],
): CrmActivityEvent[] {
  const events: CrmActivityEvent[] = [];

  for (const iv of interventions) {
    const clientName = interventionClientName(iv);
    const base = {
      interventionId: iv.id,
      interventionTitle: iv.title,
      clientName,
      address: iv.address,
    };

    const declinedTs = parseTs(iv.technicianDeclinedAt);
    if (declinedTs) {
      events.push({
        id: `${iv.id}:declined`,
        type: "intervention_technician_declined",
        ts: declinedTs,
        technicianUid: iv.technicianDeclinedByUid ?? iv.assignedTechnicianUid ?? undefined,
        actorUid: iv.technicianDeclinedByUid ?? undefined,
        actorRole: "technician",
        statusBefore: "assigned",
        statusAfter: "pending",
        ...base,
      });
    }

    const returnedTs = parseTs(iv.returnedToRequestsAt);
    if (returnedTs && returnedTs !== declinedTs) {
      events.push({
        id: `${iv.id}:returned`,
        type: "intervention_returned_to_requests",
        ts: returnedTs,
        note: iv.returnedToRequestsReason ?? undefined,
        ...base,
      });
    }
  }

  return events;
}

export function synthesizeMaterialOrderEvents(orders: MaterialOrderDoc[]): CrmActivityEvent[] {
  return orders.map((o) => ({
    id: `mo:${o.id}`,
    type: "material_ordered" as const,
    ts: parseTs(o.createdAt),
    interventionId: o.interventionId,
    orderId: o.id,
    orderLabel:
      o.partsRequested?.map((p) => `${p.quantity}× ${p.description}`).join(", ") ?? "",
  }));
}

export function synthesizeSupplierOrderEvents(orders: SupplierOrder[]): CrmActivityEvent[] {
  return orders.map((o) => ({
    id: `so:${o.id}`,
    type: "supplier_ordered" as const,
    ts: parseTs(o.createdAt),
    orderId: o.id,
    orderLabel: `${o.supplierName} — ${o.lines.map((l) => `${l.quantity}× ${l.label}`).join(", ")}`,
    orderTotalCents: o.totalCents,
  }));
}

export function synthesizeEmailEvents(
  emails: InterventionEmailDoc[],
  interventionMap: Map<string, Intervention>,
): CrmActivityEvent[] {
  return emails.map((e) => {
    const iv = e.interventionId ? interventionMap.get(e.interventionId) : undefined;
    const clientName =
      iv?.clientCompanyName ??
      iv?.clientName ??
      (iv?.clientFirstName || iv?.clientLastName
        ? [iv.clientFirstName, iv.clientLastName].filter(Boolean).join(" ")
        : undefined) ??
      undefined;
    return {
      id: `email:${e.id}`,
      type: (e.direction === "outbound" ? "email_sent" : "email_received") as CrmActivityEvent["type"],
      ts: parseTs(e.createdAt),
      interventionId: e.interventionId || undefined,
      interventionTitle: iv?.title,
      clientName,
      address: iv?.address,
      emailSubject: e.subject,
      emailFrom: e.from,
      emailTo: e.to,
    };
  });
}

export function synthesizeCommissionEvents(
  rows: CompanyCommissionAuditRow[],
  interventionMap: Map<string, Intervention>,
): CrmActivityEvent[] {
  return rows.map((r) => {
    const iv = interventionMap.get(r.interventionId);
    const clientName =
      iv?.clientCompanyName ??
      iv?.clientName ??
      (iv?.clientFirstName || iv?.clientLastName
        ? [iv.clientFirstName, iv.clientLastName].filter(Boolean).join(" ")
        : undefined) ??
      undefined;
    return {
      id: `commission:${r.id}`,
      type: "commission_calculated" as const,
      ts: parseTs(r.at),
      interventionId: r.interventionId,
      interventionTitle: iv?.title,
      clientName,
      address: iv?.address,
      commissionAmountEuros: r.finalCommissionAmount,
      commissionAction: r.action,
    };
  });
}

export function mergeAndSortCrmEvents(...sources: CrmActivityEvent[][]): CrmActivityEvent[] {
  return sources
    .flat()
    .filter((e) => e.ts > 0)
    .sort((a, b) => b.ts - a.ts);
}
