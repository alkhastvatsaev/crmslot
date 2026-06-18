import { render, screen, fireEvent, waitFor } from "@/test-utils/render";
import InterventionDetailPanel from "@/features/backoffice/components/InterventionDetailPanel";
import type { Intervention } from "@/features/interventions/types";

function doneReport(): Intervention {
  return {
    id: "iv-report-1",
    title: "Porte",
    address: "Rue Test 1",
    time: "10:00",
    status: "done",
    location: { lat: 50.8, lng: 4.35 },
    companyId: "co-1",
    clientName: "Dupont",
    problem: "Serrure bloquée",
    completionPhotoUrls: ["https://example.com/p1.jpg"],
    completionSignatureUrl: "https://example.com/sig.png",
  };
}

const baseProps = {
  interventions: [doneReport()],
  cid: "co-1",
  pwaV2: false,
  resolvedAudioUrl: null,
  isResolvingAudio: false,
  audioStorageResolveFailed: false,
  selectedReportCompletion: {
    photoUrls: ["https://example.com/p1.jpg"],
    signatureUrl: "https://example.com/sig.png",
  },
  isEditingDateTime: false,
  setIsEditingDateTime: jest.fn(),
  editDate: "",
  setEditDate: jest.fn(),
  editTime: "",
  setEditTime: jest.fn(),
  editScheduleConflicts: [],
  intakeProposedSlots: [],
  intakeSlotsTitleKey: "scheduling.proposed_slots_title",
  assignPickerOpen: false,
  setAssignPickerOpen: jest.fn(),
  isAssigning: false,
  onClose: jest.fn(),
  onCancelIntervention: jest.fn(),
  onVerify: jest.fn(),
  onArchiveReport: jest.fn(),
  onReject: jest.fn(),
  onAssign: jest.fn(),
  onDownloadQuotePdf: jest.fn(),
  onUpdateDateTime: jest.fn(),
};

describe("InterventionDetailPanel report verification", () => {
  it("shows return-to-technician button for done reports", () => {
    render(<InterventionDetailPanel selectedItem={doneReport()} {...baseProps} />);
    expect(screen.getByTestId("backoffice-inbox-reject-report")).toBeInTheDocument();
    expect(screen.getByTestId("backoffice-inbox-verify-report")).toBeInTheDocument();
  });

  it("opens reject form and calls onReject with reason", async () => {
    const onReject = jest.fn().mockResolvedValue(undefined);
    render(
      <InterventionDetailPanel selectedItem={doneReport()} {...baseProps} onReject={onReject} />
    );
    fireEvent.click(screen.getByTestId("backoffice-inbox-reject-report"));
    expect(screen.getByTestId("backoffice-inbox-reject-form")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("backoffice-inbox-reject-quick-reject_quick_photos"));
    fireEvent.click(screen.getByTestId("backoffice-inbox-reject-confirm"));

    await waitFor(() => {
      expect(onReject).toHaveBeenCalledWith("iv-report-1", expect.stringMatching(/photo/i));
    });
  });

  it("shows invoice preview when technician prepared billing lines", () => {
    render(
      <InterventionDetailPanel
        selectedItem={{
          ...doneReport(),
          billingLines: [
            { description: "Déplacement", quantity: 1, unitPriceCents: 4500 },
            { description: "Main d'œuvre", quantity: 1, unitPriceCents: 8500 },
          ],
          invoiceAmountCents: 13000,
          draftBillingAiNote: "Forfait standard",
        }}
        {...baseProps}
      />
    );
    expect(screen.getByTestId("backoffice-invoice-preview")).toBeInTheDocument();
    expect(screen.getByText("Déplacement")).toBeInTheDocument();
    expect(screen.getByTestId("backoffice-invoice-preview-total")).toHaveTextContent(/130/);
  });

  it("shows archive button for active reports", () => {
    render(<InterventionDetailPanel selectedItem={doneReport()} {...baseProps} />);
    expect(screen.getByTestId("backoffice-inbox-archive-report")).toBeInTheDocument();
  });

  it("calls onArchiveReport when archive is clicked", () => {
    const onArchiveReport = jest.fn();
    render(
      <InterventionDetailPanel
        selectedItem={{ ...doneReport(), status: "invoiced" }}
        {...baseProps}
        onArchiveReport={onArchiveReport}
      />
    );
    fireEvent.click(screen.getByTestId("backoffice-inbox-archive-report"));
    expect(onArchiveReport).toHaveBeenCalledWith("iv-report-1");
  });

  it("hides reject button when report already invoiced", () => {
    render(
      <InterventionDetailPanel
        selectedItem={{ ...doneReport(), status: "invoiced" }}
        {...baseProps}
      />
    );
    expect(screen.queryByTestId("backoffice-inbox-reject-report")).not.toBeInTheDocument();
  });
});
