import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@/test-utils/render";
import TechnicianFinishJobPanel from "@/features/interventions/components/TechnicianFinishJobPanel";
import { useTechnicianFinishJob } from "@/context/TechnicianFinishJobContext";
import { useInterventionLive } from "@/features/interventions/useInterventionLive";
import { FINISH_JOB_MIN_PHOTOS } from "@/features/interventions/finishJobConstants";

// ── Core deps ────────────────────────────────────────────────────────────────

// Override global firebase mock: provide a logged-in currentUser so submitAll doesn't bail
jest.mock("@/core/config/firebase", () => ({
  auth: { currentUser: { uid: "tech-uid-123", email: "tech@test.example" } },
  firestore: {},
  isConfigured: true,
}));

jest.mock("@/features/crmHistory/logCrmInterventionAction", () => ({
  logCrmInterventionAction: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/context/TechnicianFinishJobContext", () => ({
  useTechnicianFinishJob: jest.fn(),
}));

jest.mock("@/features/interventions/useInterventionLive", () => ({
  useInterventionLive: jest.fn(),
}));

jest.mock("@/context/OfflineSyncContext", () => ({
  useOfflineSyncOptional: () => ({
    navigatorOnline: true,
    pendingCompletionCount: 0,
    isSyncing: false,
    lastFlushReport: null,
    flushNow: jest.fn(),
    refreshPendingCount: jest.fn(),
  }),
}));

jest.mock("@/context/TechnicianBackofficeReportBridgeContext", () => ({
  useTechnicianBackofficeReportBridgeOptional: () => null,
}));

jest.mock("@/features/interventions/completionUpload", () => ({
  finalizeCompletionOfflineAware: jest.fn(() =>
    Promise.resolve({ outcome: "saved" as const }),
  ),
}));

jest.mock("@/features/interventions/finishJobCapture", () => ({
  capturePhotoFromVideo: jest.fn(() => "data:image/jpeg;base64,mockphoto"),
}));

jest.mock("@/features/interventions/technicianHubNavigation", () => ({
  navigateTechnicianHub: jest.fn(),
  TECHNICIAN_HUB_ANCHOR_MISSIONS: "technician-hub-missions",
}));

// Mock TechnicianSignaturePad — exposes imperative handle via forwardRef
const mockGetPngDataUrl = jest.fn(() => "data:image/png;base64,signature");
const mockClear = jest.fn();
jest.mock("@/features/interventions/components/TechnicianSignaturePad", () => {
  const React = require("react");
  const Pad = React.forwardRef((_props: unknown, ref: React.Ref<unknown>) => {
    React.useImperativeHandle(ref, () => ({
      getPngDataUrl: mockGetPngDataUrl,
      clear: mockClear,
    }));
    return <div data-testid="signature-pad-mock" />;
  });
  Pad.displayName = "TechnicianSignaturePad";
  return { __esModule: true, default: Pad };
});

// Mock TechnicianBillingLinesForm — surfaces the navigation callbacks
jest.mock("@/features/interventions/components/TechnicianBillingLinesForm", () => ({
  __esModule: true,
  default: ({
    onConfirm,
    onSkip,
    onBack,
  }: {
    onConfirm: (lines: unknown[]) => void;
    onSkip: () => void;
    onBack: () => void;
  }) => (
    <div data-testid="billing-lines-form-mock">
      <button data-testid="billing-confirm" onClick={() => onConfirm([])}>Confirm</button>
      <button data-testid="billing-skip" onClick={onSkip}>Skip</button>
      <button data-testid="billing-back" onClick={onBack}>Back</button>
    </div>
  ),
}));

// Mock CategoryFinishChecklist — always complete
jest.mock("@/features/interventions/components/CategoryFinishChecklist", () => ({
  __esModule: true,
  default: ({ onCompleteChange }: { onCompleteChange: (v: boolean) => void }) => {
    React.useEffect(() => { onCompleteChange(true); }, [onCompleteChange]);
    return <div data-testid="category-checklist-mock" />;
  },
}));

// ── Mock getUserMedia to avoid jsdom crash ───────────────────────────────────
const mockStream = {
  getTracks: () => [{ stop: jest.fn() }],
};
Object.defineProperty(global.navigator, "mediaDevices", {
  value: { getUserMedia: jest.fn(() => Promise.resolve(mockStream)) },
  writable: true,
  configurable: true,
});

// ── Shared mocks ─────────────────────────────────────────────────────────────
const mockUseFinishJob = useTechnicianFinishJob as jest.MockedFunction<typeof useTechnicianFinishJob>;
const mockUseInterventionLive = useInterventionLive as jest.MockedFunction<typeof useInterventionLive>;

const MOCK_IV = {
  id: "iv-001",
  clientName: "Dubois",
  category: "serrurerie",
  problem: "Porte bloquée",
  status: "in_progress" as const,
} as unknown as ReturnType<typeof mockUseInterventionLive>;

function setupActive(interventionId = "iv-001") {
  mockUseFinishJob.mockReturnValue({
    finishJobInterventionId: interventionId,
    setFinishJobInterventionId: jest.fn(),
  });
  mockUseInterventionLive.mockReturnValue(MOCK_IV);
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe("TechnicianFinishJobPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Empty / guard states ──────────────────────────────────────────────────
  it("renders empty state when no intervention is active", () => {
    mockUseFinishJob.mockReturnValue({
      finishJobInterventionId: null,
      setFinishJobInterventionId: jest.fn(),
    });
    render(<TechnicianFinishJobPanel />);
    expect(screen.getByTestId("finish-job-empty")).toBeInTheDocument();
  });

  // ── Step: photos ──────────────────────────────────────────────────────────
  it("renders photo step when intervention is active", () => {
    setupActive();
    render(<TechnicianFinishJobPanel />);
    expect(screen.getByTestId("finish-job-panel")).toBeInTheDocument();
    expect(screen.getByTestId("finish-job-capture-btn")).toBeInTheDocument();
  });

  it("step indicator is rendered at the bottom", () => {
    setupActive();
    render(<TechnicianFinishJobPanel />);
    expect(screen.getByTestId("finish-job-step-indicator")).toBeInTheDocument();
    // Photos step active
    expect(screen.getByTestId("finish-step-photos")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("finish-step-billing")).toHaveAttribute("data-active", "false");
  });

  it("continue-photos button disabled with fewer than MIN_PHOTOS photos", () => {
    setupActive();
    render(<TechnicianFinishJobPanel />);
    const continueBtn = screen.getByTestId("finish-job-continue-photos");
    expect(continueBtn).toBeDisabled();
  });

  it("continue-photos button enabled after capturing MIN_PHOTOS photos", async () => {
    setupActive();
    render(<TechnicianFinishJobPanel />);
    const captureBtn = screen.getByTestId("finish-job-capture-btn");

    for (let i = 0; i < FINISH_JOB_MIN_PHOTOS; i++) {
      fireEvent.click(captureBtn);
    }

    await waitFor(() => {
      expect(screen.getByTestId("finish-job-continue-photos")).not.toBeDisabled();
    });
  });

  it("photo thumbnails appear in the strip after each capture", async () => {
    setupActive();
    render(<TechnicianFinishJobPanel />);
    const captureBtn = screen.getByTestId("finish-job-capture-btn");

    fireEvent.click(captureBtn);
    fireEvent.click(captureBtn);

    await waitFor(() => {
      expect(screen.getByTestId("finish-job-photo-remove-0")).toBeInTheDocument();
      expect(screen.getByTestId("finish-job-photo-remove-1")).toBeInTheDocument();
    });
  });

  it("remove button removes a photo from the strip", async () => {
    setupActive();
    render(<TechnicianFinishJobPanel />);
    const captureBtn = screen.getByTestId("finish-job-capture-btn");
    fireEvent.click(captureBtn);
    fireEvent.click(captureBtn);

    await waitFor(() => expect(screen.getByTestId("finish-job-photo-remove-0")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("finish-job-photo-remove-0"));

    await waitFor(() => {
      expect(screen.queryByTestId("finish-job-photo-remove-1")).not.toBeInTheDocument();
    });
  });

  // ── Step: billing ─────────────────────────────────────────────────────────
  it("advances to billing step after clicking continue-photos", async () => {
    setupActive();
    render(<TechnicianFinishJobPanel />);
    const captureBtn = screen.getByTestId("finish-job-capture-btn");

    for (let i = 0; i < FINISH_JOB_MIN_PHOTOS; i++) {
      fireEvent.click(captureBtn);
    }
    await waitFor(() =>
      expect(screen.getByTestId("finish-job-continue-photos")).not.toBeDisabled(),
    );

    fireEvent.click(screen.getByTestId("finish-job-continue-photos"));

    await waitFor(() => {
      expect(screen.getByTestId("billing-lines-form-mock")).toBeInTheDocument();
      expect(screen.getByTestId("finish-step-billing")).toHaveAttribute("data-active", "true");
    });
  });

  it("billing back button returns to photo step", async () => {
    setupActive();
    render(<TechnicianFinishJobPanel />);

    // Get to billing
    const captureBtn = screen.getByTestId("finish-job-capture-btn");
    for (let i = 0; i < FINISH_JOB_MIN_PHOTOS; i++) fireEvent.click(captureBtn);
    await waitFor(() => expect(screen.getByTestId("finish-job-continue-photos")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("finish-job-continue-photos"));
    await waitFor(() => expect(screen.getByTestId("billing-lines-form-mock")).toBeInTheDocument());

    // Go back
    fireEvent.click(screen.getByTestId("billing-back"));

    await waitFor(() => {
      expect(screen.getByTestId("finish-job-capture-btn")).toBeInTheDocument();
      expect(screen.getByTestId("finish-step-photos")).toHaveAttribute("data-active", "true");
    });
  });

  // ── Step: signature ───────────────────────────────────────────────────────
  it("advances to signature step after billing skip", async () => {
    setupActive();
    render(<TechnicianFinishJobPanel />);

    const captureBtn = screen.getByTestId("finish-job-capture-btn");
    for (let i = 0; i < FINISH_JOB_MIN_PHOTOS; i++) fireEvent.click(captureBtn);
    await waitFor(() => expect(screen.getByTestId("finish-job-continue-photos")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("finish-job-continue-photos"));
    await waitFor(() => expect(screen.getByTestId("billing-lines-form-mock")).toBeInTheDocument());

    fireEvent.click(screen.getByTestId("billing-skip"));

    await waitFor(() => {
      expect(screen.getByTestId("signature-pad-mock")).toBeInTheDocument();
      expect(screen.getByTestId("finish-step-signature")).toHaveAttribute("data-active", "true");
    });
  });

  it("back button on signature step returns to billing", async () => {
    setupActive();
    render(<TechnicianFinishJobPanel />);

    const captureBtn = screen.getByTestId("finish-job-capture-btn");
    for (let i = 0; i < FINISH_JOB_MIN_PHOTOS; i++) fireEvent.click(captureBtn);
    await waitFor(() => expect(screen.getByTestId("finish-job-continue-photos")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("finish-job-continue-photos"));
    await waitFor(() => expect(screen.getByTestId("billing-lines-form-mock")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("billing-skip"));
    await waitFor(() => expect(screen.getByTestId("signature-pad-mock")).toBeInTheDocument());

    fireEvent.click(screen.getByTestId("finish-job-back-billing"));

    await waitFor(() => {
      expect(screen.getByTestId("billing-lines-form-mock")).toBeInTheDocument();
    });
  });

  it("clear button calls signature pad clear()", async () => {
    setupActive();
    render(<TechnicianFinishJobPanel />);

    const captureBtn = screen.getByTestId("finish-job-capture-btn");
    for (let i = 0; i < FINISH_JOB_MIN_PHOTOS; i++) fireEvent.click(captureBtn);
    await waitFor(() => expect(screen.getByTestId("finish-job-continue-photos")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("finish-job-continue-photos"));
    await waitFor(() => expect(screen.getByTestId("billing-lines-form-mock")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("billing-skip"));
    await waitFor(() => expect(screen.getByTestId("signature-pad-mock")).toBeInTheDocument());

    fireEvent.click(screen.getByTestId("finish-job-clear-signature"));
    expect(mockClear).toHaveBeenCalledTimes(1);
  });

  it("submit calls finalizeCompletionOfflineAware with photos + signature", async () => {
    setupActive();
    render(<TechnicianFinishJobPanel />);

    const captureBtn = screen.getByTestId("finish-job-capture-btn");
    for (let i = 0; i < FINISH_JOB_MIN_PHOTOS; i++) fireEvent.click(captureBtn);
    await waitFor(() => expect(screen.getByTestId("finish-job-continue-photos")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("finish-job-continue-photos"));
    await waitFor(() => expect(screen.getByTestId("billing-lines-form-mock")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("billing-skip"));
    await waitFor(() => expect(screen.getByTestId("signature-pad-mock")).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByTestId("finish-job-submit"));
    });

    const { finalizeCompletionOfflineAware } = jest.requireMock(
      "@/features/interventions/completionUpload",
    ) as { finalizeCompletionOfflineAware: jest.Mock };

    await waitFor(() => {
      expect(finalizeCompletionOfflineAware).toHaveBeenCalledWith(
        expect.objectContaining({
          interventionId: "iv-001",
          signaturePngDataUrl: "data:image/png;base64,signature",
          photoDataUrls: expect.arrayContaining(["data:image/jpeg;base64,mockphoto"]),
        }),
      );
    });
  });
});
