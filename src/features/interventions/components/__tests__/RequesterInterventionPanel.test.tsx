import React from "react";
import { render, screen, fireEvent, waitFor } from "@/test-utils/render";
import RequesterInterventionPanel from "@/features/interventions/components/RequesterInterventionPanel";
import RequesterProfilePanel from "@/features/interventions/components/RequesterProfilePanel";
import {
  RequesterHubProvider,
  useRequesterHub,
  type InterventionRequestData,
} from "@/context/RequesterHubContext";
import { mockState } from "@/test-utils/mockState";

// ── External deps ────────────────────────────────────────────────────────────
jest.mock("@/core/api/fetchWithAuth", () => ({
  fetchWithAuth: jest.fn(() => Promise.resolve({ ok: true, json: async () => ({}) })),
}));

jest.mock("@/features/interventions/compressImageToDataUrl", () => ({
  compressImageToDataUrl: jest.fn((f: File) => Promise.resolve(`data:image/jpeg;base64,${f.name}`)),
}));

jest.mock("@/features/interventions/recordDuplicateAlertIfNeeded", () => ({
  recordDuplicateAlertIfNeeded: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/features/interventions/smartFormReverseGeocode", () => ({
  resolveInterventionAddressFromCoords: jest.fn(() =>
    Promise.resolve({
      formatted: "Rue de la Loi 1, 1000 Bruxelles",
      location: { lat: 50.84, lng: 4.35 },
    })
  ),
}));

jest.mock("@/features/interventions/clientAudioUpload", () => ({
  uploadInterventionAudioToFirebase: jest.fn(() => Promise.resolve(null)),
  isPersistableClientAudioUrl: jest.fn((url: string | null) => !!url),
}));

jest.mock("@/features/interventions/detectDuplicates", () => ({
  findPotentialDuplicates: jest.fn(() => []),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/features/interventions/components/SmartFormAddressAutocomplete", () => ({
  __esModule: true,
  default: ({ value, onValueChange }: { value: string; onValueChange: (v: string) => void }) => (
    <input
      data-testid="address-autocomplete"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    />
  ),
}));

jest.mock("@/features/interventions/components/SmartFormAddressMiniMap", () => ({
  __esModule: true,
  default: () => <div data-testid="address-minimap" />,
}));

jest.mock("@/features/interventions/components/SmartTimeSlotPicker", () => ({
  SmartTimeSlotPicker: () => <div data-testid="time-slot-picker" />,
}));

jest.mock("@/core/config/firebase", () => {
  const { mockState } = jest.requireActual(
    "@/test-utils/mockState"
  ) as typeof import("@/test-utils/mockState");
  return {
    auth: {
      get currentUser() {
        return mockState.currentUser;
      },
    },
    firestore: {},
    storage: {},
    isConfigured: true,
  };
});

jest.mock("@/context/CompanyWorkspaceContext", () => ({
  useCompanyWorkspaceOptional: jest.fn(() => null),
}));

jest.mock("@/context/BackofficeInboxIntentContext", () => ({
  useBackofficeInboxIntentOptional: jest.fn(() => null),
}));

jest.mock("@/features/interventions/useBrowserSpeechDictation", () => ({
  useBrowserSpeechDictation: jest.fn(() => ({
    listening: false,
    supported: false,
    toggleListening: jest.fn(),
    interimTranscript: "",
  })),
}));

// ── Helper ───────────────────────────────────────────────────────────────────
function renderPanel() {
  return render(
    <RequesterHubProvider>
      <RequesterInterventionPanel />
    </RequesterHubProvider>
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe("RequesterInterventionPanel", () => {
  beforeEach(() => {
    localStorage.clear();
    mockState.reset();
  });

  it("renders the panel root", () => {
    renderPanel();
    expect(screen.getByTestId("requester-intervention-panel")).toBeInTheDocument();
  });

  it("shows template buttons on step 0", () => {
    renderPanel();
    expect(screen.getByTestId("smart-form-template-blocked")).toBeInTheDocument();
    expect(screen.getByTestId("smart-form-template-locked-out")).toBeInTheDocument();
  });

  it("advances to step 1 (voice) after template selection", () => {
    renderPanel();
    fireEvent.click(screen.getByTestId("smart-form-template-blocked"));
    // Step 0 template grid disappears, step 1 mic button appears
    expect(screen.queryByTestId("smart-form-template-blocked")).not.toBeInTheDocument();
    // Mic button accessible label from step 1
    expect(
      screen.getByRole("button", { name: /press to speak|parler|spreken/i })
    ).toBeInTheDocument();
  });

  it("submit button absent until step 4", () => {
    renderPanel();
    expect(screen.queryByTestId("intervention-submit-btn")).not.toBeInTheDocument();
  });

  it("submit button disabled when address is empty (step 4)", async () => {
    render(
      <RequesterHubProvider>
        <Step4Driver address="" problem="Porte bloquée" />
      </RequesterHubProvider>
    );
    const btn = await screen.findByTestId("intervention-submit-btn");
    expect(btn).toBeDisabled();
  });

  it("blocks submit without login on connexion tab", async () => {
    mockState.currentUser = {
      uid: "anon-uid",
      isAnonymous: true,
      email: null,
      emailVerified: false,
      displayName: null,
      photoURL: null,
      providerData: [],
      getIdToken: async () => "anon-token",
    } as unknown as typeof mockState.currentUser;

    render(
      <RequesterHubProvider>
        <Step4WithProfile address="Rue de la Loi 1, 1000 Bruxelles" problem="Porte bloquée" />
      </RequesterHubProvider>
    );

    const btn = await screen.findByTestId("intervention-submit-btn");
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByTestId("profile-type-probe")).toHaveTextContent("login");
    });
    expect(screen.getByTestId("requester-type-login")).toHaveAttribute("aria-selected", "true");

    const { setDoc } = jest.requireMock("firebase/firestore") as { setDoc: jest.Mock };
    expect(setDoc).not.toHaveBeenCalled();
  });

  it("submits on Enter when step 4 form is complete", async () => {
    mockState.currentUser = {
      uid: "anon-uid",
      isAnonymous: true,
      email: null,
      emailVerified: false,
      displayName: null,
      photoURL: null,
      providerData: [],
      getIdToken: async () => "anon-token",
    } as unknown as typeof mockState.currentUser;

    render(
      <RequesterHubProvider>
        <Step4WithProfile address="Rue de la Loi 1, 1000 Bruxelles" problem="Porte bloquée" />
      </RequesterHubProvider>
    );

    const step4 = await screen.findByTestId("requester-step4");
    fireEvent.keyDown(step4, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("profile-type-probe")).toHaveTextContent("login");
    });
  });

  it("last step is not scrollable", async () => {
    render(
      <RequesterHubProvider>
        <Step4Driver address="Rue Test" problem="Porte bloquée" />
      </RequesterHubProvider>
    );
    const step4 = await screen.findByTestId("requester-step4");
    expect(step4.className).not.toMatch(/overflow-y-auto/);
    expect(step4.className).toMatch(/overflow-hidden/);
  });
});

function ProfileTypeProbe() {
  const { profile } = useRequesterHub();
  return <span data-testid="profile-type-probe">{profile.type}</span>;
}

function Step4WithProfile({ address, problem }: { address: string; problem: string }) {
  return (
    <>
      <ProfileTypeProbe />
      <RequesterProfilePanel />
      <Step4Driver address={address} problem={problem} />
    </>
  );
}

// ── Inner component that drives the hub context to step 4 then renders panel ─
function Step4Driver({ address, problem }: { address: string; problem: string }) {
  const { setCurrentStep, setRequestData } = useRequesterHub();

  React.useEffect(() => {
    setRequestData((prev: InterventionRequestData) => ({
      ...prev,
      interventionAddress: address,
      problemLabel: problem,
    }));
    setCurrentStep(4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <RequesterInterventionPanel />;
}
