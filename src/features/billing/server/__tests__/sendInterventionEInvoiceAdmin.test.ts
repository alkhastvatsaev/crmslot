/** @jest-environment node */

import type { Intervention } from "@/features/interventions";
import {
  companyToUblSupplier,
  interventionToUblInput,
  sendInterventionEInvoiceAdmin,
} from "../sendInterventionEInvoiceAdmin";

const mockAssert = jest.fn();
jest.mock("@/features/backoffice/assignInterventionServerAuth", () => ({
  assertCanAssignInterventionServer: (...args: unknown[]) => mockAssert(...args),
}));

function iv(partial: Partial<Intervention> = {}): Intervention {
  return {
    id: "iv-1",
    title: "Porte",
    address: "Rue Haute 1, Bruxelles",
    time: "10:00",
    status: "invoiced",
    location: { lat: 50.8, lng: 4.35 },
    companyId: "co-1",
    invoiceNumber: "FAC-2026-00042",
    clientFirstName: "Jean",
    clientLastName: "Dupont",
    billingLines: [{ description: "Cylindre", quantity: 1, unitPriceCents: 9000 }],
    ...partial,
  } as Intervention;
}

const mockUpdate = jest.fn(async () => undefined);

function makeDb(intervention: Intervention | null, companyData: Record<string, unknown> = {}) {
  return {
    collection: (name: string) => ({
      doc: () => ({
        get: async () =>
          name === "interventions"
            ? {
                exists: intervention != null,
                id: intervention?.id,
                data: () => intervention,
              }
            : { exists: true, data: () => companyData },
        update: mockUpdate,
      }),
    }),
  } as never;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAssert.mockResolvedValue(true);
});

describe("companyToUblSupplier", () => {
  it("mappe les champs société avec alias", () => {
    const supplier = companyToUblSupplier({
      name: "MAP SRL",
      tva: "BE0123456789",
      address: "Rue 1",
      city: "Bruxelles",
      zip: "1000",
    });
    expect(supplier).toMatchObject({
      name: "MAP SRL",
      vatNumber: "BE0123456789",
      street: "Rue 1",
      postalZone: "1000",
    });
  });
});

describe("interventionToUblInput", () => {
  it("filtre les lignes invalides et nomme le client", () => {
    const input = interventionToUblInput(
      iv({
        billingLines: [
          { description: "OK", quantity: 1, unitPriceCents: 100 },
          { description: "", quantity: 1, unitPriceCents: 100 },
          { description: "Zero", quantity: 0, unitPriceCents: 100 },
        ],
      }),
      { name: "MAP" },
      "BE71096123456769",
      new Date("2026-06-10T00:00:00Z")
    );
    expect(input.lines).toHaveLength(1);
    expect(input.customer.name).toBe("Jean Dupont");
    expect(input.issueDate).toBe("2026-06-10");
    expect(input.dueDate).toBe("2026-07-10");
    expect(input.invoiceNumber).toBe("FAC-2026-00042");
  });
});

describe("sendInterventionEInvoiceAdmin", () => {
  const params = {
    interventionId: "iv-1",
    actorUid: "admin-1",
    decoded: { uid: "admin-1" } as never,
  };

  it("génère l'UBL, envoie via mock et trace eInvoice", async () => {
    const db = makeDb(iv(), { name: "MAP SRL", vatNumber: "BE0123456789", iban: "BE71" });
    const result = await sendInterventionEInvoiceAdmin({ db, ...params });
    expect(result.transmission.ok).toBe(true);
    expect(result.transmission.provider).toBe("mock");
    expect(result.ublXml).toContain("<cbc:ID>FAC-2026-00042</cbc:ID>");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        eInvoice: expect.objectContaining({ status: "sent", provider: "mock" }),
      })
    );
  });

  it("refuse si statut non invoiced", async () => {
    const db = makeDb(iv({ status: "done" }));
    await expect(sendInterventionEInvoiceAdmin({ db, ...params })).rejects.toThrow("invoiced");
  });

  it("refuse sans numéro de facture légal", async () => {
    const db = makeDb(iv({ invoiceNumber: null }));
    await expect(sendInterventionEInvoiceAdmin({ db, ...params })).rejects.toThrow(
      "Numéro de facture légal manquant"
    );
  });

  it("refuse sans droits", async () => {
    mockAssert.mockResolvedValue(false);
    const db = makeDb(iv());
    await expect(sendInterventionEInvoiceAdmin({ db, ...params })).rejects.toThrow("Droits");
  });

  it("refuse sans lignes de facturation", async () => {
    const db = makeDb(iv({ billingLines: [] }));
    await expect(sendInterventionEInvoiceAdmin({ db, ...params })).rejects.toThrow("Aucune ligne");
  });
});
