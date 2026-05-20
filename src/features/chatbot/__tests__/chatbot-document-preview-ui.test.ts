import {
  isDocumentPreviewOpen,
  isPreviewOverlayForTarget,
} from "@/features/chatbot/chatbot-document-preview-ui";

describe("chatbot-document-preview-ui", () => {
  it("isPreviewOverlayForTarget respects overlay side", () => {
    const preview = {
      loading: false,
      blobUrl: "blob:x",
      error: null,
      overlayTarget: "left" as const,
    };
    expect(isPreviewOverlayForTarget(preview, "left")).toBe(true);
    expect(isPreviewOverlayForTarget(preview, "right")).toBe(false);
  });

  it("defaults missing overlayTarget to right", () => {
    expect(
      isPreviewOverlayForTarget(
        { loading: true, blobUrl: null, error: null, overlayTarget: null },
        "right",
      ),
    ).toBe(true);
  });

  it("isDocumentPreviewOpen when loading", () => {
    expect(isDocumentPreviewOpen({ loading: true, blobUrl: null, error: null })).toBe(true);
  });
});
