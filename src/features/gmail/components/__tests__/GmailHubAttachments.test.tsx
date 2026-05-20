import { screen, fireEvent } from "@testing-library/react";
import { render } from "@/test-utils/render";
import GmailHubAttachments from "@/features/gmail/components/GmailHubAttachments";

describe("GmailHubAttachments", () => {
  it("delegates PDF open to parent (no inline iframe)", () => {
    const onOpenPdf = jest.fn();
    render(
      <GmailHubAttachments
        attachments={[
          {
            attachmentId: "att-1",
            filename: "devis.pdf",
            mimeType: "application/pdf",
            size: 12000,
          },
        ]}
        activeAttachmentId={null}
        loadingId={null}
        onOpenPdf={onOpenPdf}
      />,
    );

    fireEvent.click(screen.getByTestId("gmail-hub-attachment-att-1"));
    expect(onOpenPdf).toHaveBeenCalledWith(
      expect.objectContaining({ attachmentId: "att-1", filename: "devis.pdf" }),
    );
    expect(screen.queryByTestId("gmail-hub-pdf-iframe")).not.toBeInTheDocument();
  });
});
