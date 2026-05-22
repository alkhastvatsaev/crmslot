import { screen, fireEvent, waitFor } from "@testing-library/react";
import { render } from "@/test-utils/render";
import GmailHubAttachments from "@/features/gmail/components/GmailHubAttachments";

jest.mock("@/features/gmail/renderPdfThumbnail", () => ({
  renderPdfFirstPageThumbnail: jest.fn(() =>
    Promise.resolve("data:image/jpeg;base64,mock-thumb"),
  ),
}));

const PDF_ATT = {
  attachmentId: "att-1",
  filename: "devis.pdf",
  mimeType: "application/pdf",
  size: 12000,
};

describe("GmailHubAttachments", () => {
  it("shows PDF thumbnail image after load and passes cached preview on click", async () => {
    const onOpenPdf = jest.fn();
    const loadAttachment = jest.fn().mockResolvedValue({
      dataBase64: "JVBERi0xLjQK",
      mimeType: "application/pdf",
      filename: "devis.pdf",
    });

    render(
      <GmailHubAttachments
        messageId="msg-1"
        attachments={[PDF_ATT]}
        activeAttachmentId={null}
        loadingId={null}
        loadAttachment={loadAttachment}
        onOpenPdf={onOpenPdf}
      />,
    );

    expect(screen.getByTestId("gmail-hub-attachments-grid")).toHaveClass("justify-center");
    const tile = screen.getByTestId("gmail-hub-attachment-att-1");
    expect(tile.closest("li")).toHaveClass("size-[132px]");

    await waitFor(() => {
      expect(loadAttachment).toHaveBeenCalledWith("msg-1", expect.objectContaining({ attachmentId: "att-1" }));
    });

    await waitFor(() => {
      expect(screen.getByTestId("gmail-hub-attachment-preview-att-1")).toHaveAttribute(
        "src",
        "data:image/jpeg;base64,mock-thumb",
      );
    });

    fireEvent.click(tile);
    expect(onOpenPdf).toHaveBeenCalledWith(
      expect.objectContaining({ attachmentId: "att-1", filename: "devis.pdf" }),
      expect.objectContaining({
        thumbnailUrl: "data:image/jpeg;base64,mock-thumb",
        blobUrl: expect.stringMatching(/^blob:/),
      }),
    );
    expect(screen.queryByTestId("gmail-hub-pdf-iframe")).not.toBeInTheDocument();
  });

  it("falls back to icon when loadAttachment is missing", () => {
    const onOpenPdf = jest.fn();
    render(
      <GmailHubAttachments
        messageId="msg-1"
        attachments={[PDF_ATT]}
        activeAttachmentId={null}
        loadingId={null}
        onOpenPdf={onOpenPdf}
      />,
    );

    expect(screen.queryByTestId("gmail-hub-attachment-preview-att-1")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("gmail-hub-attachment-att-1"));
    expect(onOpenPdf).toHaveBeenCalledWith(
      expect.objectContaining({ attachmentId: "att-1" }),
      null,
    );
  });
});
