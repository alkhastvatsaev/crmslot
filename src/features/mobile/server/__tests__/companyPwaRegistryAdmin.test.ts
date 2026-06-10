import {
  buildCompanyPwaRegistry,
  mapMaterialOrderDoc,
  mapSupplierOrderDoc,
  serializePwaRegistryTimestamp,
} from "@/features/mobile/server/companyPwaRegistryAdmin";

const FIXED_MS = Date.parse("2026-06-07T12:00:00.000Z");

describe("companyPwaRegistryAdmin", () => {
  describe("serializePwaRegistryTimestamp", () => {
    it("convertit un Timestamp Firestore Admin", () => {
      expect(serializePwaRegistryTimestamp({ seconds: 1_700_000_000 }, FIXED_MS)).toBe(
        new Date(1_700_000_000_000).toISOString()
      );
    });

    it("accepte ISO string", () => {
      expect(serializePwaRegistryTimestamp("2026-01-15T10:30:00.000Z", FIXED_MS)).toBe(
        "2026-01-15T10:30:00.000Z"
      );
    });

    it("utilise fallback si invalide", () => {
      expect(serializePwaRegistryTimestamp(null, FIXED_MS)).toBe(new Date(FIXED_MS).toISOString());
    });
  });

  describe("buildCompanyPwaRegistry", () => {
    it("trie supplierOrders du plus récent au plus ancien", () => {
      const payload = buildCompanyPwaRegistry(
        "co-1",
        [
          {
            id: "so-old",
            data: () => ({
              createdAt: "2026-01-01T00:00:00.000Z",
              updatedAt: "2026-01-01T00:00:00.000Z",
              status: "draft",
            }),
          },
          {
            id: "so-new",
            data: () => ({
              createdAt: "2026-06-01T00:00:00.000Z",
              updatedAt: "2026-06-01T00:00:00.000Z",
              status: "sent",
              clientName: "Dupont",
            }),
          },
        ],
        [],
        { fallbackMs: FIXED_MS }
      );

      expect(payload.supplierOrders.map((o) => o.id)).toEqual(["so-new", "so-old"]);
      expect(payload.supplierOrders[0]?.clientName).toBe("Dupont");
      expect(payload.supplierOrders[0]?.companyId).toBe("co-1");
    });

    it("limite materialOrders à 30", () => {
      const docs = Array.from({ length: 35 }, (_, i) => ({
        id: `mo-${i}`,
        data: () => ({
          companyId: "co-1",
          createdAt: new Date(FIXED_MS - i * 1000).toISOString(),
          updatedAt: new Date(FIXED_MS - i * 1000).toISOString(),
        }),
      }));

      const payload = buildCompanyPwaRegistry("co-1", [], docs, { fallbackMs: FIXED_MS });
      expect(payload.materialOrders).toHaveLength(30);
      expect(payload.materialOrders[0]?.id).toBe("mo-0");
    });
  });

  describe("mapSupplierOrderDoc / mapMaterialOrderDoc", () => {
    it("lit clientName depuis nom legacy", () => {
      const supplier = mapSupplierOrderDoc(
        {
          id: "s1",
          data: () => ({ nom: "  Martin  ", status: "draft" }),
        },
        "co-x",
        FIXED_MS
      );
      expect(supplier.clientName).toBe("Martin");

      const material = mapMaterialOrderDoc(
        {
          id: "m1",
          data: () => ({ companyId: "co-x", nomClient: "Bernard" }),
        },
        FIXED_MS
      );
      expect(material.clientName).toBe("Bernard");
    });
  });
});
