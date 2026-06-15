import { render, screen, waitFor, act } from "@/test-utils/render";
import { onAuthStateChanged } from "firebase/auth";
import RequesterTrackingPanel from "@/features/interventions/components/RequesterTrackingPanel";
import { useRequesterHub } from "@/features/interventions/context/RequesterHubContext";

jest.mock("@/features/interventions/context/RequesterHubContext", () => ({
  useRequesterHub: jest.fn(),
}));

jest.mock("@/core/config/firebase", () => ({
  auth: {
    currentUser: {
      uid: "user-1",
      isAnonymous: false,
      email: "pierre@example.com",
      emailVerified: true,
    },
  },
  clientPortalAuth: {
    currentUser: {
      uid: "user-1",
      isAnonymous: false,
      email: "pierre@example.com",
      emailVerified: true,
    },
  },
  firestore: {},
  isConfigured: true,
}));

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn(
    (
      _auth: unknown,
      cb: (
        user: {
          uid: string;
          email: string;
          isAnonymous: boolean;
          emailVerified: boolean;
        } | null
      ) => void
    ) => {
      cb({
        uid: "user-1",
        email: "pierre@example.com",
        isAnonymous: false,
        emailVerified: true,
      });
      return jest.fn();
    }
  ),
}));

const mockDocs: Array<{ id: string; data: () => Record<string, unknown> }> = [];

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn((_q: unknown, onNext: (snap: { docs: typeof mockDocs }) => void) => {
    onNext({ docs: mockDocs });
    return jest.fn();
  }),
}));

const mockUseRequesterHub = useRequesterHub as jest.Mock;

describe("RequesterTrackingPanel", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockDocs.length = 0;
    mockDocs.push({
      id: "iv-1",
      data: () => ({
        status: "pending",
        title: "Chaudière",
        clientFirstName: "Pierre",
        clientLastName: "Martin",
        clientEmail: "pierre@example.com",
        createdAt: "2026-06-08T10:00:00.000Z",
      }),
    });
    mockDocs.push({
      id: "iv-other",
      data: () => ({
        status: "en_route",
        title: "Porte claquée",
        clientFirstName: "Martin",
        clientLastName: "Dupont",
        clientEmail: "martin@example.com",
        createdAt: "2026-06-07T10:00:00.000Z",
      }),
    });
    mockUseRequesterHub.mockReturnValue({
      isSubmitting: false,
      requestData: {
        problemLabel: "",
        description: "",
        interventionAddress: "",
      },
      lastSubmittedRequest: null,
      lastSubmittedInterventionId: null,
      profile: {
        firstName: "Pierre",
        lastName: "Martin",
        companyName: "",
        type: "login",
        phone: "",
        email: "pierre@example.com",
      },
      pendingTrackingInterventionId: null,
      setPendingTrackingInterventionId: jest.fn(),
      portalAccessSession: null,
      lastSubmittedPortalAccessCode: null,
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  async function renderPanel() {
    render(<RequesterTrackingPanel />);
    await act(async () => {
      jest.advanceTimersByTime(20);
    });
  }

  it("renders one-page dossier shell for the signed-in client only", async () => {
    await renderPanel();

    await waitFor(() => {
      expect(screen.getByTestId("tracking-one-page")).toBeInTheDocument();
    });
    expect(screen.getByTestId("tracking-headline")).toHaveTextContent(/demande enregistrée/i);
    expect(screen.getByText("Pierre Martin")).toBeInTheDocument();
    expect(screen.queryByText("Martin Dupont")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tracking-search-bar")).not.toBeInTheDocument();
  });

  it("shows dossier lookup when login tab is selected without auth", async () => {
    (onAuthStateChanged as jest.Mock).mockImplementationOnce((_auth, cb) => {
      cb(null);
      return jest.fn();
    });
    mockUseRequesterHub.mockReturnValue({
      isSubmitting: false,
      requestData: {
        problemLabel: "",
        description: "",
        interventionAddress: "",
      },
      lastSubmittedRequest: null,
      lastSubmittedInterventionId: null,
      profile: {
        firstName: "",
        lastName: "",
        companyName: "",
        type: "login",
        phone: "",
        email: "",
      },
      pendingTrackingInterventionId: null,
      setPendingTrackingInterventionId: jest.fn(),
      portalAccessSession: null,
      lastSubmittedPortalAccessCode: null,
    });
    mockDocs.length = 0;

    await renderPanel();

    await waitFor(() => {
      expect(screen.getByTestId("tracking-portal-access-section")).toBeInTheDocument();
    });
    expect(screen.queryByText(/connectez-vous/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("tracking-portal-access-email")).not.toBeInTheDocument();
  });

  it("shows draft tracking while composing a new request instead of another client case", async () => {
    mockUseRequesterHub.mockReturnValue({
      isSubmitting: false,
      requestData: {
        problemLabel: "Porte claquée",
        description: "",
        interventionAddress: "Rue Duquesnoy 5, Bruxelles",
      },
      lastSubmittedRequest: null,
      lastSubmittedInterventionId: null,
      profile: {
        firstName: "Pierre",
        lastName: "Martin",
        companyName: "",
        type: "particulier",
        phone: "0987654321",
        email: "pierre@example.com",
      },
      pendingTrackingInterventionId: null,
      setPendingTrackingInterventionId: jest.fn(),
      portalAccessSession: null,
      lastSubmittedPortalAccessCode: null,
    });

    await renderPanel();

    await waitFor(() => {
      expect(screen.getByTestId("tracking-step-screen")).toHaveAttribute(
        "data-tracking-phase",
        "draft"
      );
    });
    expect(screen.getByTestId("tracking-headline")).toHaveTextContent(/complétez votre demande/i);
    expect(screen.queryByText("Martin Dupont")).not.toBeInTheDocument();
  });

  it("shows portal access section without portal session", async () => {
    mockUseRequesterHub.mockReturnValue({
      isSubmitting: false,
      requestData: {
        problemLabel: "",
        description: "",
        interventionAddress: "",
      },
      lastSubmittedRequest: null,
      lastSubmittedInterventionId: null,
      lastSubmittedPortalAccessCode: "AB12 CD34",
      profile: {
        firstName: "Marie",
        lastName: "Dupont",
        companyName: "",
        type: "login",
        phone: "0470123456",
        email: "marie@example.com",
      },
      pendingTrackingInterventionId: null,
      setPendingTrackingInterventionId: jest.fn(),
      portalAccessSession: null,
    });
    mockDocs.length = 0;
    (onAuthStateChanged as jest.Mock).mockImplementationOnce((_auth, cb) => {
      cb(null);
      return jest.fn();
    });

    await renderPanel();

    await waitFor(() => {
      expect(screen.getByTestId("tracking-portal-access-section")).toBeInTheDocument();
      expect(screen.getByTestId("requester-submitted-dossier-number")).toHaveTextContent(
        "AB12 CD34"
      );
    });
  });

  it("tolerates legacy requestData without string fields from localStorage", async () => {
    mockUseRequesterHub.mockReturnValue({
      isSubmitting: false,
      requestData: {} as never,
      lastSubmittedRequest: null,
      lastSubmittedInterventionId: null,
      profile: {
        firstName: "Pierre",
        lastName: "Martin",
        companyName: "",
        type: "login",
        phone: "",
        email: "pierre@example.com",
      },
      pendingTrackingInterventionId: null,
      setPendingTrackingInterventionId: jest.fn(),
      portalAccessSession: null,
      lastSubmittedPortalAccessCode: null,
    });

    await renderPanel();

    await waitFor(() => {
      expect(screen.getByTestId("tracking-one-page")).toBeInTheDocument();
    });
  });
});
