import {
  buildChatbotOrderImageLookups,
  buildMaterialOrderImageLookup,
  buildSupplierOrderImageLookup,
} from "@/features/chatbot/chatbotOrderImageLookup";

describe("chatbotOrderImageLookup", () => {
  it("uses lecot sku from supplier line", () => {
    expect(
      buildSupplierOrderImageLookup({
        id: "ord-1",
        companyId: "co",
        supplierId: "lecot",
        supplierName: "Lecot",
        status: "sent",
        lines: [{ sku: "LEC-CYL-2012", label: "Cylindre", quantity: 1, unitPriceCents: 1000 }],
        totalCents: 1000,
        createdAt: "2026-05-01",
        updatedAt: "2026-05-01",
      })
    ).toEqual({
      orderId: "ord-1",
      reference: "LEC-CYL-2012",
      description: "Cylindre",
      lecotSku: "LEC-CYL-2012",
    });
  });

  it("maps generic sku via stock label", () => {
    expect(
      buildSupplierOrderImageLookup({
        id: "ord-2",
        companyId: "co",
        supplierId: "lecot",
        supplierName: "Lecot",
        status: "sent",
        lines: [
          {
            sku: "A1",
            label: "Cylindre européen 80 mm sécurité",
            quantity: 1,
            unitPriceCents: 1000,
          },
        ],
        totalCents: 1000,
        createdAt: "2026-05-01",
        updatedAt: "2026-05-01",
      })
    ).toEqual({
      orderId: "ord-2",
      reference: "CYL-EURO-80",
      description: "Cylindre européen 80 mm sécurité",
      lecotSku: "LEC-CYL-2012",
    });
  });

  it("uses stock reference from material order part", () => {
    expect(
      buildMaterialOrderImageLookup({
        id: "mo-1",
        interventionId: "INT-1",
        technicianUid: "tech",
        partsRequested: [{ description: "Gâche électrique", quantity: 1, reference: "GACH-ELEC" }],
        urgency: "normal",
        status: "pending",
        createdAt: "2026-05-01",
        updatedAt: "2026-05-01",
      })
    ).toEqual({
      orderId: "mo-1",
      reference: "GACH-ELEC",
      description: "Gâche électrique",
      lecotSku: "LEC-CTL-4003",
    });
  });

  it("merges supplier and material lookups", () => {
    const rows = buildChatbotOrderImageLookups(
      [
        {
          id: "s1",
          companyId: "co",
          supplierId: "lecot",
          supplierName: "Lecot",
          status: "sent",
          lines: [{ sku: "BAR-A2P", label: "Barillet", quantity: 1, unitPriceCents: 100 }],
          totalCents: 100,
          createdAt: "2026-05-01",
          updatedAt: "2026-05-01",
        },
      ],
      [
        {
          id: "m1",
          interventionId: "INT-1",
          technicianUid: "tech",
          partsRequested: [{ description: "Vis", quantity: 1, reference: "VIS-INOX-6" }],
          urgency: "normal",
          status: "pending",
          createdAt: "2026-05-01",
          updatedAt: "2026-05-01",
        },
      ]
    );
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.orderId)).toEqual(["s1", "m1"]);
  });
});
