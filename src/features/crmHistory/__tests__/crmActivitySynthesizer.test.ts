import {
  mergeAndSortCrmEvents,
  synthesizeCommissionEvents,
  synthesizeEmailEvents,
  synthesizeInterventionEvents,
  synthesizeInterventionBillingEvents,
  synthesizeInterventionLifecycleEvents,
  synthesizeMaterialOrderEvents,
  synthesizeSupplierOrderEvents,
} from "../crmActivitySynthesizer";
import type { Intervention } from "@/features/interventions/types";
import type { MaterialOrderDoc } from "@/features/materials/materialOrderFirestore";
import type { SupplierOrder } from "@/features/suppliers/types";
import type { InterventionEmailDoc } from "@/features/emails/interventionEmailFirestore";
import type { CompanyCommissionAuditRow } from "@/features/commissions/commissionFirestore";

const baseIntervention: Intervention = {
  id: "iv1",
  title: "Serrure bloquée",
  address: "Rue de la Loi 1, Bruxelles",
  time: "09:00",
  status: "done",
  location: { lat: 50.85, lng: 4.35 },
  clientName: "Dupont SA",
  createdAt: "2024-01-15T08:00:00Z",
  completedAt: "2024-01-15T10:00:00Z",
};

describe("synthesizeInterventionEvents", () => {
  it("produces a created event from createdAt", () => {
    const evts = synthesizeInterventionEvents([baseIntervention]);
    const created = evts.find((e) => e.type === "intervention_created");
    expect(created).toBeDefined();
    expect(created?.interventionId).toBe("iv1");
    expect(created?.clientName).toBe("Dupont SA");
  });

  it("produces a completed event from completedAt", () => {
    const evts = synthesizeInterventionEvents([baseIntervention]);
    const completed = evts.find((e) => e.type === "intervention_completed");
    expect(completed).toBeDefined();
    expect(completed?.ts).toBeGreaterThan(0);
  });

  it("does not produce duplicate events for same timestamp", () => {
    const iv: Intervention = {
      ...baseIntervention,
      completedAt: baseIntervention.completedAt,
      invoicedAt: baseIntervention.completedAt,
    };
    const evts = synthesizeInterventionEvents([iv]);
    const byType = evts.map((e) => e.type);
    expect(byType.filter((t) => t === "intervention_completed")).toHaveLength(1);
  });

  it("returns empty array for empty input", () => {
    expect(synthesizeInterventionEvents([])).toHaveLength(0);
  });

  it("produces invoiced event from status when invoicedAt is missing", () => {
    const evts = synthesizeInterventionEvents([
      {
        ...baseIntervention,
        status: "invoiced",
        invoicedAt: null,
        statusUpdatedAt: "2024-01-16T11:00:00Z",
      },
    ]);
    expect(evts.find((e) => e.type === "intervention_invoiced")).toBeDefined();
  });
});

describe("synthesizeInterventionBillingEvents", () => {
  it("emits billing event when billingLines and statusUpdatedAt exist", () => {
    const evts = synthesizeInterventionBillingEvents([
      {
        ...baseIntervention,
        statusUpdatedAt: "2024-01-16T12:00:00Z",
        billingLines: [{ description: "Main d'œuvre", quantity: 1, unitPriceCents: 12_000 }],
        invoiceAmountCents: 12_000,
      },
    ]);
    expect(evts).toHaveLength(1);
    expect(evts[0].type).toBe("intervention_billing_updated");
    expect(evts[0].note).toContain("Facture");
  });
});

describe("synthesizeInterventionLifecycleEvents", () => {
  it("emits decline event from technicianDeclinedAt", () => {
    const evts = synthesizeInterventionLifecycleEvents([
      {
        ...baseIntervention,
        status: "pending",
        technicianDeclinedAt: "2024-01-15T11:30:00Z",
        technicianDeclinedByUid: "tech-9",
      },
    ]);
    expect(evts.some((e) => e.type === "intervention_technician_declined")).toBe(true);
  });
});

describe("synthesizeMaterialOrderEvents", () => {
  it("maps a material order to material_ordered event", () => {
    const order: MaterialOrderDoc = {
      id: "mo1",
      companyId: "c1",
      interventionId: "iv1",
      technicianUid: "u1",
      status: "pending",
      urgency: "normal",
      createdAt: "2024-01-15T09:00:00Z",
      updatedAt: "2024-01-15T09:00:00Z",
      partsRequested: [{ description: "Cylindre", quantity: 2 }],
    };
    const evts = synthesizeMaterialOrderEvents([order]);
    expect(evts).toHaveLength(1);
    expect(evts[0].type).toBe("material_ordered");
    expect(evts[0].orderLabel).toContain("Cylindre");
  });
});

describe("synthesizeSupplierOrderEvents", () => {
  it("maps a supplier order to supplier_ordered event", () => {
    const order: SupplierOrder = {
      id: "so1",
      companyId: "c1",
      supplierId: "lecot",
      supplierName: "Lecot",
      status: "sent",
      lines: [{ sku: "CYL-50", label: "Cylindre 50mm", quantity: 1, unitPriceCents: 4500 }],
      totalCents: 4500,
      createdAt: "2024-01-16T07:00:00Z",
      updatedAt: "2024-01-16T07:00:00Z",
    };
    const evts = synthesizeSupplierOrderEvents([order]);
    expect(evts).toHaveLength(1);
    expect(evts[0].type).toBe("supplier_ordered");
    expect(evts[0].orderTotalCents).toBe(4500);
    expect(evts[0].orderLabel).toContain("Lecot");
  });

  it("uses sentAt when createdAt is pending (server timestamp)", () => {
    const order: SupplierOrder = {
      id: "so-ts",
      companyId: "c1",
      supplierId: "lecot",
      supplierName: "Lecot",
      status: "sent",
      lines: [{ sku: "A", label: "Article", quantity: 1, unitPriceCents: 100 }],
      totalCents: 100,
      createdAt: "",
      updatedAt: "",
      sentAt: "2024-02-01T10:00:00Z",
      clientName: "Martin",
    };
    const evts = synthesizeSupplierOrderEvents([order]);
    expect(evts.length).toBeGreaterThan(0);
    expect(evts[0].ts).toBeGreaterThan(0);
    expect(evts[0].clientName).toBe("Martin");
  });
});

describe("synthesizeEmailEvents", () => {
  const ivMap = new Map<string, Intervention>([
    [
      "iv1",
      {
        id: "iv1",
        title: "Serrure",
        address: "Rue A",
        time: "10:00",
        status: "done",
        location: { lat: 0, lng: 0 },
        clientName: "Marie",
      },
    ],
  ]);

  it("maps outbound email to email_sent", () => {
    const email: InterventionEmailDoc = {
      id: "em1",
      interventionId: "iv1",
      companyId: "c1",
      direction: "outbound",
      from: "team@belg.be",
      to: "client@example.com",
      subject: "Confirmation d'intervention",
      bodyText: "Bonjour...",
      messageId: "<abc@belg.be>",
      createdAt: "2024-01-15T09:30:00Z",
    };
    const evts = synthesizeEmailEvents([email], ivMap);
    expect(evts[0].type).toBe("email_sent");
    expect(evts[0].emailSubject).toBe("Confirmation d'intervention");
    expect(evts[0].clientName).toBe("Marie");
  });

  it("maps inbound email to email_received", () => {
    const email: InterventionEmailDoc = {
      id: "em2",
      interventionId: "iv1",
      companyId: "c1",
      direction: "inbound",
      from: "client@example.com",
      to: "team@belg.be",
      subject: "Re: Confirmation",
      bodyText: "Merci...",
      messageId: "<xyz@example.com>",
      createdAt: "2024-01-15T10:00:00Z",
    };
    const evts = synthesizeEmailEvents([email], ivMap);
    expect(evts[0].type).toBe("email_received");
  });
});

describe("synthesizeCommissionEvents", () => {
  const ivMap = new Map<string, Intervention>([
    [
      "iv1",
      {
        id: "iv1",
        title: "Serrure",
        address: "Rue B",
        time: "11:00",
        status: "invoiced",
        location: { lat: 0, lng: 0 },
        clientName: "Paul",
      },
    ],
  ]);

  it("maps commission row to commission_calculated", () => {
    const row: CompanyCommissionAuditRow = {
      id: "comm1",
      companyId: "c1",
      interventionId: "iv1",
      action: "calculated",
      finalCommissionAmount: 45.5,
      byUid: "u1",
      at: "2024-01-15T11:00:00Z",
    };
    const evts = synthesizeCommissionEvents([row], ivMap);
    expect(evts[0].type).toBe("commission_calculated");
    expect(evts[0].commissionAmountEuros).toBe(45.5);
    expect(evts[0].clientName).toBe("Paul");
  });
});

describe("mergeAndSortCrmEvents", () => {
  it("sorts events newest first", () => {
    const a = { id: "a", type: "intervention_created" as const, ts: 1000 };
    const b = { id: "b", type: "material_ordered" as const, ts: 3000 };
    const c = { id: "c", type: "supplier_ordered" as const, ts: 2000 };
    const result = mergeAndSortCrmEvents([a], [b], [c]);
    expect(result.map((e) => e.ts)).toEqual([3000, 2000, 1000]);
  });
});
