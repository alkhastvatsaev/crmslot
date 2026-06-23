import type { Intervention } from "@/features/interventions";
import type { MaterialOrderDoc } from "@/features/materials";
import type { SupplierOrder } from "@/features/suppliers";
import type { InterventionEmailDoc } from "@/features/emails";
import type { CompanyCommissionAuditRow } from "@/features/commissions";
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
      events.push({
        id: `${iv.id}:completed`,
        type: "intervention_completed",
        ts: completedTs,
        ...base,
      });
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

/** Refus terrain / retour file Demandes (champs dénormalisés — rétroactif). */
export function synthesizeInterventionLifecycleEvents(
  interventions: Intervention[]
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

function resolveOrderEventTs(...candidates: unknown[]): number {
  for (const raw of candidates) {
    const ts = parseTs(raw);
    if (ts > 0) return ts;
  }
  return Date.now();
}

export function synthesizeMaterialOrderEvents(orders: MaterialOrderDoc[]): CrmActivityEvent[] {
  return orders.map((o) => {
    const orderLabel =
      o.partsRequested?.map((p) => `${p.quantity}× ${p.description}`).join(", ") ?? "";
    const clientName =
      typeof o.clientName === "string" && o.clientName.trim() ? o.clientName.trim() : undefined;
    return {
      id: `mo:${o.id}`,
      type: "material_ordered" as const,
      ts: resolveOrderEventTs(o.updatedAt, o.createdAt),
      interventionId: o.interventionId,
      orderId: o.id,
      orderLabel,
      clientName,
      materialOrderStatus: o.status,
      note: clientName ? `Client : ${clientName}` : undefined,
    };
  });
}

export function synthesizeSupplierOrderEvents(orders: SupplierOrder[]): CrmActivityEvent[] {
  const events: CrmActivityEvent[] = [];
  for (const o of orders) {
    const clientName =
      typeof o.clientName === "string" && o.clientName.trim() ? o.clientName.trim() : undefined;
    const orderLabel = `${o.supplierName} — ${o.lines.map((l) => `${l.quantity}× ${l.label}`).join(", ")}`;
    const baseTs = resolveOrderEventTs(o.sentAt, o.updatedAt, o.createdAt);
    events.push({
      id: `so:${o.id}`,
      type: "supplier_ordered" as const,
      ts: baseTs,
      interventionId: o.interventionId ?? undefined,
      orderId: o.id,
      orderLabel,
      orderTotalCents: o.totalCents,
      clientName,
      materialOrderStatus: o.status,
      note: [
        clientName ? `Client : ${clientName}` : null,
        `Statut : ${o.status}`,
        o.isDemo ? "(démo)" : null,
      ]
        .filter(Boolean)
        .join(" · "),
    });
    if (o.status === "sent" && o.sentAt && parseTs(o.sentAt) > 0 && parseTs(o.sentAt) !== baseTs) {
      events.push({
        id: `so:${o.id}:sent`,
        type: "material_order_status_changed" as const,
        ts: parseTs(o.sentAt),
        interventionId: o.interventionId ?? undefined,
        orderId: o.id,
        orderLabel,
        clientName,
        note: `Commande ${o.supplierName} envoyée`,
        materialOrderStatus: "sent",
      });
    }
  }
  return events;
}

export function synthesizeEmailEvents(
  emails: InterventionEmailDoc[],
  interventionMap: Map<string, Intervention>
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
      type: (e.direction === "outbound"
        ? "email_sent"
        : "email_received") as CrmActivityEvent["type"],
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
  interventionMap: Map<string, Intervention>
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
