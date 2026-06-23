import {
  buildInterventionClientLabelMap,
  buildSupplierOrderClientNameByOrderId,
  buildSupplierOrderInterventionIdByOrderId,
  resolveOrderListClientLabel,
  resolveSupplierOrderClientLabel,
  resolveSupplierOrderListClientLabel,
} from "@/features/chatbot/chatbotOrderClientLabels";
import { MATERIAL_ORDER_CLIENT_FALLBACK } from "@/features/materials/materialOrderClientName";
import type { Intervention } from "@/features/interventions";
import type { MaterialOrderDoc } from "@/features/materials";
import type { SupplierOrder } from "@/features/suppliers";

const intervention: Intervention = {
  id: "iv-dupont-42",
  companyId: "co-1",
  status: "assigned",
  title: "",
  address: "",
  time: "",
  location: { lat: 0, lng: 0 },
  clientFirstName: "Jean",
  clientLastName: "Dupont",
};

const order: SupplierOrder = {
  id: "ord-lecot-1",
  companyId: "co-1",
  supplierId: "lecot",
  supplierName: "Lecot",
  status: "sent",
  lines: [{ sku: "CYL-YALE", label: "Cylindre Yale", quantity: 2, unitPriceCents: 4500 }],
  totalCents: 9000,
  createdAt: "2026-05-19T10:00:00.000Z",
  updatedAt: "2026-05-19T10:00:00.000Z",
};

describe("chatbotOrderClientLabels", () => {
  it("builds labels from all company interventions", () => {
    const map = buildInterventionClientLabelMap([], null, [intervention]);
    expect(map.get("iv-dupont-42")).toMatch(/Dupont/i);
  });

  it("resolves client via material order when supplier order has no interventionId", () => {
    const orderWithoutIv: SupplierOrder = { ...order, interventionId: undefined };
    const material: MaterialOrderDoc = {
      id: "mo-1",
      interventionId: "iv-dupont-42",
      technicianUid: "tech-1",
      partsRequested: [],
      urgency: "normal",
      status: "ordered",
      createdAt: "2026-05-19T10:00:00.000Z",
      updatedAt: "2026-05-19T10:00:00.000Z",
      supplierOrderId: "ord-lecot-1",
    };
    const labels = buildInterventionClientLabelMap([], null, [intervention]);
    const orderToIv = buildSupplierOrderInterventionIdByOrderId([orderWithoutIv], [material]);
    expect(
      resolveSupplierOrderClientLabel(
        orderWithoutIv.id,
        orderWithoutIv.interventionId,
        orderToIv,
        labels
      )
    ).toMatch(/Dupont/i);
  });

  it("resolveSupplierOrderListClientLabel uses bon clientName and linked material order", () => {
    const orderWithoutName: SupplierOrder = { ...order, clientName: undefined };
    const material: MaterialOrderDoc = {
      id: "mo-2",
      interventionId: "iv-dupont-42",
      technicianUid: "tech-1",
      partsRequested: [],
      urgency: "normal",
      status: "ordered",
      createdAt: "2026-05-19T10:00:00.000Z",
      updatedAt: "2026-05-19T10:00:00.000Z",
      supplierOrderId: "ord-lecot-1",
      clientName: "Dupont depuis bon matériel",
    };
    const byId = buildSupplierOrderClientNameByOrderId([orderWithoutName], [material]);
    const ivMap = buildInterventionClientLabelMap([], null, []);
    const ivByOrder = buildSupplierOrderInterventionIdByOrderId([orderWithoutName], [material]);
    expect(resolveSupplierOrderListClientLabel(orderWithoutName, byId, ivByOrder, ivMap)).toBe(
      "Dupont depuis bon matériel"
    );
  });

  it("resolveOrderListClientLabel prefers stored name then intervention then fallback", () => {
    expect(resolveOrderListClientLabel("Dupont SA", null)).toBe("Dupont SA");
    expect(resolveOrderListClientLabel(null, "Jean Dupont")).toBe("Jean Dupont");
    expect(resolveOrderListClientLabel(null, null)).toBe(MATERIAL_ORDER_CLIENT_FALLBACK);
  });

  it("prefers invoice label over snapshot for same intervention", () => {
    const map = buildInterventionClientLabelMap(
      [
        {
          interventionId: "iv-1",
          clientLabel: "Dupont",
          status: "invoiced",
          totalCents: 0,
          invoicedAt: null,
          problem: null,
        },
      ],
      {
        generatedAt: "",
        locale: "fr",
        company: { id: "co", name: null, role: null },
        summary: {
          totalInterventions: 1,
          byStatus: {},
          urgentOpen: 0,
          awaitingAssignment: 0,
          inProgress: 0,
          doneOrInvoiced: 0,
          unpaidCount: 0,
          paidCount: 0,
          pendingOfflineQueue: 0,
          navigatorOnline: true,
        },
        clients: [],
        interventions: [
          {
            id: "iv-1",
            title: "",
            status: "pending",
            clientName: "Autre",
            address: null,
            problem: null,
            scheduled: null,
            paymentStatus: null,
            invoiceAmountEur: null,
            urgency: false,
            hasAudio: false,
            hasInvoicePdf: false,
            clientEmail: null,
          },
        ],
      },
      []
    );
    expect(resolveSupplierOrderClientLabel("ord-x", "iv-1", new Map(), map)).toBe("Dupont");
  });
});
