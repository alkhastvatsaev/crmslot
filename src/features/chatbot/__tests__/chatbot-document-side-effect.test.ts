import {
  documentToolSuccessMessage,
  extractDocumentPreviewFromResult,
  isChatbotBillingWriteTool,
  isChatbotZeroTokenUiTool,
  MINIMAL_DOCUMENT_TOOL_RESULT_JSON,
} from "@/features/chatbot/chatbot-document-side-effect";

describe("chatbot-document-side-effect", () => {
  it("detects billing vs focus tools", () => {
    expect(isChatbotBillingWriteTool("patch_intervention_billing")).toBe(true);
    expect(isChatbotZeroTokenUiTool("focus_intervention_document")).toBe(true);
    expect(isChatbotZeroTokenUiTool("list_clients")).toBe(false);
  });

  it("order_lecot is not a zero-token document tool", () => {
    expect(isChatbotZeroTokenUiTool("order_lecot_parts")).toBe(false);
  });

  it("lecot order success message does not require ok flag", () => {
    expect(
      documentToolSuccessMessage("order_lecot_parts", {
        supplierOrderId: "ord-1",
        totalEur: 12,
      }),
    ).toContain("Commande Lecot");
    expect(
      documentToolSuccessMessage("order_lecot_parts", {
        supplierOrderId: "ord-1",
        totalEur: 12,
      }),
    ).not.toContain("Action impossible");
  });

  it("success messages distinguish billing and PWA focus", () => {
    expect(documentToolSuccessMessage("patch_intervention_billing", { ok: true, totalEur: 500 })).toContain(
      "PWA",
    );
    expect(documentToolSuccessMessage("focus_intervention_document", { ok: true })).toContain("PWA");
  });

  it("extracts preview payload", () => {
    expect(
      extractDocumentPreviewFromResult({
        ok: true,
        interventionId: "iv1",
        previewDocumentType: "invoice",
      }),
    ).toEqual({ interventionId: "iv1", documentType: "invoice" });
  });

  it("minimal model payload is tiny", () => {
    expect(MINIMAL_DOCUMENT_TOOL_RESULT_JSON.length).toBeLessThan(30);
  });
});
