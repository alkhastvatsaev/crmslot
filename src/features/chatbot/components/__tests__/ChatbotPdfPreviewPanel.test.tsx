import { screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import ChatbotPdfPreviewPanel from "@/features/chatbot/components/ChatbotPdfPreviewPanel";

jest.mock("@/features/chatbot/ChatbotContext", () => ({
  useChatbotContext: () => ({
    documentPreview: {
      interventionId: "",
      kind: "quote",
      title: "",
      blobUrl: null,
      loading: false,
      error: null,
    },
  }),
}));

describe("ChatbotPdfPreviewPanel", () => {
  it("renders empty pdf preview state", () => {
    render(<ChatbotPdfPreviewPanel />);
    expect(screen.getByTestId("chatbot-pdf-preview-panel")).toBeInTheDocument();
    expect(screen.getByTestId("chatbot-pdf-empty")).toBeInTheDocument();
  });
});
