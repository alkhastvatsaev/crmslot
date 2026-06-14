import { MockESignProvider } from "../ESignProvider";

describe("MockESignProvider", () => {
  it("crée une demande de signature mock", async () => {
    const provider = new MockESignProvider();
    const result = await provider.createSignRequest({
      interventionId: "iv-1",
      documentType: "report",
      signerEmail: "client@example.com",
      signerName: "Client",
    });
    expect(result.ok).toBe(true);
    expect(result.signUrl).toContain("sign-mock");
    expect(result.status).toBe("pending");
  });
});
