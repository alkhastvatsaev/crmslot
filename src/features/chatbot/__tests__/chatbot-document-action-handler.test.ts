/** @jest-environment node */

import {
  handleChatbotDocumentActionPost,
  resolveDocumentActionTool,
} from "@/features/chatbot/chatbot-document-action-handler";
import { readSseJsonLines } from "@/features/chatbot/testFixtures/readSseJsonLines";
import { executeChatbotTool } from "@/features/chatbot/chatbot-tool-executor";

jest.mock("@/features/chatbot/chatbot-tool-executor", () => ({
  executeChatbotTool: jest.fn(),
}));

const mockExecuteChatbotTool = executeChatbotTool as jest.MockedFunction<typeof executeChatbotTool>;

const auth = { uid: "uid-test" };

describe("chatbot-document-action-handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecuteChatbotTool.mockResolvedValue({
      ok: true,
      interventionId: "iv-fourche",
      documentType: "invoice",
    });
  });

  it("resolveDocumentActionTool requires companyId and interventionId", () => {
    expect(resolveDocumentActionTool({ interventionId: "iv-1" })).toEqual({
      ok: false,
      status: 400,
      error: "companyId et interventionId requis",
    });
  });

  it("resolveDocumentActionTool rejects invalid documentType", () => {
    expect(
      resolveDocumentActionTool({
        companyId: "co-test",
        interventionId: "iv-1",
        action: "preview",
        documentType: "not-a-pdf",
      }),
    ).toEqual({
      ok: false,
      status: 400,
      error: "documentType invalide",
    });
  });

  it("resolveDocumentActionTool maps preview to focus_intervention_document", () => {
    expect(
      resolveDocumentActionTool({
        companyId: "co-test",
        interventionId: "iv-fourche",
        action: "preview",
        documentType: "invoice",
      }),
    ).toEqual({
      ok: true,
      toolName: "focus_intervention_document",
      toolInput: { interventionId: "iv-fourche", documentType: "invoice" },
    });
  });

  it("resolveDocumentActionTool requires lines for append_billing", () => {
    expect(
      resolveDocumentActionTool({
        companyId: "co-test",
        interventionId: "iv-1",
        action: "append_billing",
        lines: [],
      }),
    ).toEqual({
      ok: false,
      status: 400,
      error: "lines requis",
    });
  });

  it("handleChatbotDocumentActionPost streams document_preview", async () => {
    const res = await handleChatbotDocumentActionPost(
      {
        companyId: "co-test",
        interventionId: "iv-fourche",
        action: "preview",
        documentType: "invoice",
      },
      auth,
    );

    expect(mockExecuteChatbotTool).toHaveBeenCalledWith(
      "focus_intervention_document",
      { interventionId: "iv-fourche", documentType: "invoice" },
      expect.objectContaining({ companyId: "co-test", actorUid: "uid-test" }),
    );

    const events = await readSseJsonLines(res);
    expect(events[0]).toMatchObject({
      type: "document_preview",
      interventionId: "iv-fourche",
      documentType: "invoice",
    });
    expect(events.some((e) => (e as { type?: string }).type === "done")).toBe(true);
  });
});
