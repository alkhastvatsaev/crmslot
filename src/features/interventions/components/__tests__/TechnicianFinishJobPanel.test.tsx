import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@/test-utils/render";
import TechnicianFinishJobPanel from "@/features/interventions/components/TechnicianFinishJobPanel";
import { useTechnicianFinishJob } from "@/context/TechnicianFinishJobContext";
import { useInterventionLive } from "@/features/interventions/useInterventionLive";
import { FINISH_JOB_MIN_PHOTOS } from "@/features/interventions/finishJobConstants";

jest.mock("@/core/config/firebase", () => ({
  auth: { currentUser: { uid: "tech-uid-123", email: "tech@test.example" } },
  firestore: {},
  isConfigured: true,
}));

jest.mock("@/core/api/fetchWithAuth", () => ({
  fetchWithAuth: jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({
        ok: true,
        billingLines: [{ description: "Déplacement", quantity: 1, unitPriceCents: 4500 }],
        aiNote: "Forfait",
      }),
    })
  ),
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
  finalizeCompletionOfflineAware: jest.fn(() => Promise.resolve({ outcome: "saved" as const })),
}));

jest.mock("@/features/interventions/finishJobCapture", () => ({
  capturePhotoFromVideo: jest.fn(() => "data:image/jpeg;base64,mockphoto"),
}));

jest.mock("@/features/interventions/technicianHubNavigation", () => ({
  navigateTechnicianHub: jest.fn(),
  TECHNICIAN_HUB_ANCHOR_MISSIONS: "technician-hub-missions",
}));

const mockGetPngDataUrl = jest.fn(() => "data:image/png;base64,signature");
const mockClear = jest.fn();
jest.mock("@/features/interventions/components/TechnicianSignaturePad", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest mock factory
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

const mockStream = {
  getTracks: () => [{ stop: jest.fn() }],
};
Object.defineProperty(global.navigator, "mediaDevices", {
  value: { getUserMedia: jest.fn(() => Promise.resolve(mockStream)) },
  writable: true,
  configurable: true,
});

const mockUseFinishJob = useTechnicianFinishJob as jest.MockedFunction<
  typeof useTechnicianFinishJob
>;
const mockUseInterventionLive = useInterventionLive as jest.MockedFunction<
  typeof useInterventionLive
>;

const MOCK_IV = {
  id: "iv-001",
  clientName: "Dubois",
  clientEmail: "client@test.example",
  category: "serrurerie",
  problem: "Porte bloquée",
  status: "in_progress" as const,
} as unknown as ReturnType<typeof mockUseInterventionLive>;

function setupActive(interventionId = "iv-001") {
  mockUseFinishJob.mockReturnValue({
    finishJobInterventionId: interventionId,
    finishJobEntryStep: null,
    setFinishJobInterventionId: jest.fn(),
    startFinishJob: jest.fn(),
  });
  mockUseInterventionLive.mockReturnValue(MOCK_IV);
}

async function goToSignatureStep() {
  const captureBtn = screen.getByTestId("finish-job-capture-btn");
  for (let i = 0; i < FINISH_JOB_MIN_PHOTOS; i++) {
    fireEvent.click(captureBtn);
  }
  await waitFor(() => expect(screen.getByTestId("finish-job-continue-photos")).not.toBeDisabled());
  fireEvent.click(screen.getByTestId("finish-job-continue-photos"));
  await waitFor(() => expect(screen.getByTestId("signature-pad-mock")).toBeInTheDocument());
}

describe("TechnicianFinishJobPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders empty state when no intervention is active", () => {
    mockUseFinishJob.mockReturnValue({
      finishJobInterventionId: null,
      finishJobEntryStep: null,
      setFinishJobInterventionId: jest.fn(),
      startFinishJob: jest.fn(),
    });
    render(<TechnicianFinishJobPanel />);
    expect(screen.getByTestId("finish-job-empty")).toBeInTheDocument();
  });

  it("renders photo step when intervention is active", () => {
    setupActive();
    render(<TechnicianFinishJobPanel />);
    expect(screen.getByTestId("finish-job-panel")).toBeInTheDocument();
    expect(screen.getByTestId("finish-job-capture-btn")).toBeInTheDocument();
  });

  it("step indicator includes photos, signature and invoice", () => {
    setupActive();
    render(<TechnicianFinishJobPanel />);
    expect(screen.getByTestId("finish-step-photos")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("finish-step-billing")).toBeInTheDocument();
  });

  it("advances to signature step after photos", async () => {
    setupActive();
    render(<TechnicianFinishJobPanel />);
    await goToSignatureStep();
    expect(screen.getByTestId("finish-step-signature")).toHaveAttribute("data-active", "true");
  });

  it("back button on signature returns to photos", async () => {
    setupActive();
    render(<TechnicianFinishJobPanel />);
    await goToSignatureStep();
    fireEvent.click(screen.getByTestId("finish-job-back-photos"));
    await waitFor(() => {
      expect(screen.getByTestId("finish-job-capture-btn")).toBeInTheDocument();
    });
  });

  it("submit saves completion then shows invoice step", async () => {
    setupActive();
    render(<TechnicianFinishJobPanel />);
    await goToSignatureStep();

    await act(async () => {
      fireEvent.click(screen.getByTestId("finish-job-submit"));
    });

    const { finalizeCompletionOfflineAware } = jest.requireMock(
      "@/features/interventions/completionUpload"
    ) as { finalizeCompletionOfflineAware: jest.Mock };

    await waitFor(() => {
      expect(finalizeCompletionOfflineAware).toHaveBeenCalledWith(
        expect.objectContaining({
          interventionId: "iv-001",
          signaturePngDataUrl: "data:image/png;base64,signature",
          photoDataUrls: expect.arrayContaining(["data:image/jpeg;base64,mockphoto"]),
        })
      );
      expect(screen.getByTestId("finish-job-step-invoice")).toBeInTheDocument();
      expect(screen.getByTestId("finish-invoice-send")).toBeInTheDocument();
    });
  });
});
