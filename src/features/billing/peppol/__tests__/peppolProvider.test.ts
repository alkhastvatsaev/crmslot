import { getPeppolProvider, MockPeppolProvider } from "../peppolProvider";

const META = { invoiceNumber: "FAC-2026-00001", companyId: "c1", interventionId: "iv-1" };

describe("MockPeppolProvider", () => {
  it("simule un envoi réussi avec transmissionId", async () => {
    const result = await new MockPeppolProvider().send(
      "<Invoice><cbc:ID>X</cbc:ID></Invoice>",
      META
    );
    expect(result.ok).toBe(true);
    expect(result.provider).toBe("mock");
    expect(result.transmissionId).toContain("mock-FAC-2026-00001");
  });

  it("refuse un XML sans cbc:ID", async () => {
    const result = await new MockPeppolProvider().send("<Invoice/>", META);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("UBL invalide");
  });
});

describe("getPeppolProvider", () => {
  it("mock par défaut sans configuration", () => {
    expect(getPeppolProvider({}).name).toBe("mock");
  });

  it("utilise Billit quand PEPPOL_PROVIDER=billit", () => {
    expect(getPeppolProvider({ PEPPOL_PROVIDER: "billit" }).name).toBe("billit");
  });

  it("retombe sur mock pour un provider inconnu", () => {
    expect(getPeppolProvider({ PEPPOL_PROVIDER: "banqup" }).name).toBe("mock");
  });
});
