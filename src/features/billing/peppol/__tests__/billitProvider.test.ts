import { BillitPeppolProvider } from "../billitProvider";

describe("BillitPeppolProvider", () => {
  it("simule l'envoi même si BILLIT_API_KEY est définie (client HTTP non implémenté)", async () => {
    const prev = process.env.BILLIT_API_KEY;
    process.env.BILLIT_API_KEY = "test-key";
    const provider = new BillitPeppolProvider();
    const result = await provider.send("<cbc:ID>FAC-1</cbc:ID>", {
      invoiceNumber: "FAC-1",
      companyId: "c1",
      interventionId: "iv1",
    });
    process.env.BILLIT_API_KEY = prev;
    expect(result.ok).toBe(true);
    expect(result.provider).toBe("billit");
  });

  it("simule l'envoi sans clé API", async () => {
    const provider = new BillitPeppolProvider();
    const result = await provider.send("<cbc:ID>FAC-1</cbc:ID>", {
      invoiceNumber: "FAC-1",
      companyId: "c1",
      interventionId: "iv1",
    });
    expect(result.ok).toBe(true);
    expect(result.provider).toBe("billit");
    expect(result.transmissionId).toContain("billit-mock");
  });
});
