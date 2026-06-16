import { fireEvent, waitFor } from "@testing-library/react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { toast } from "sonner";
import { render, screen } from "@/test-utils/render";
import { renderWithPager } from "@/test-utils/renderWithPager";
import ClientPortalAuthPanel from "@/features/auth/components/ClientPortalAuthPanel";
import { syncClientPortalProfile } from "@/features/auth/clientPortalProfile";

jest.mock("@/features/auth/clientPortalProfile", () => ({
  syncClientPortalProfile: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/features/gmail/components/GmailGoogleConnectButton", () => ({
  __esModule: true,
  default: ({
    onClick,
    disabled,
    dataTestId,
  }: {
    onClick: () => void;
    disabled?: boolean;
    dataTestId?: string;
  }) => (
    <button type="button" data-testid={dataTestId} disabled={disabled} onClick={onClick}>
      Google
    </button>
  ),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    message: jest.fn(),
  },
}));

const mockSync = syncClientPortalProfile as jest.MockedFunction<typeof syncClientPortalProfile>;

describe("ClientPortalAuthPanel", () => {
  beforeEach(() => {
    mockSync.mockClear();
    (toast.success as jest.Mock).mockClear();
    (toast.error as jest.Mock).mockClear();
  });

  it("renders password fields in auth rail mode without inner tabs", () => {
    render(<ClientPortalAuthPanel authRailMode authTab="login" />);
    expect(screen.queryByTestId("client-portal-tab-login")).not.toBeInTheDocument();
    expect(screen.queryByText(/espace client/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("client-portal-password")).toBeInTheDocument();
    expect(screen.queryByTestId("client-portal-magic-send")).not.toBeInTheDocument();
    expect(screen.queryByText(/smart link/i)).not.toBeInTheDocument();
  });

  it("does not mount credential fields in auth rail when carousel is on map page", () => {
    window.history.pushState({}, "", "/");
    renderWithPager(<ClientPortalAuthPanel authRailMode authTab="login" />, 6, {
      initialPageIndex: 0,
    });
    expect(screen.queryByTestId("client-portal-password")).not.toBeInTheDocument();
    expect(screen.queryByTestId("client-portal-email")).not.toBeInTheDocument();
  });

  it("mounts credential fields in auth rail when carousel is on company hub", () => {
    window.history.pushState({}, "", "/m/demande");
    renderWithPager(<ClientPortalAuthPanel authRailMode authTab="login" />, 1, {
      initialPageIndex: 0,
    });
    expect(screen.getByTestId("client-portal-password")).toBeInTheDocument();
  });

  it("shows confirm password field on register tab", () => {
    render(<ClientPortalAuthPanel authRailMode authTab="register" />);
    expect(screen.getByTestId("client-portal-password-confirm")).toBeInTheDocument();
  });

  it("signs in with email and password", async () => {
    render(<ClientPortalAuthPanel authRailMode />);
    fireEvent.change(screen.getByTestId("client-portal-email"), {
      target: { value: "client@test.example" },
    });
    fireEvent.change(screen.getByTestId("client-portal-password"), {
      target: { value: "secret123" },
    });
    fireEvent.click(screen.getByTestId("client-portal-email-submit"));

    await waitFor(() => expect(signInWithEmailAndPassword).toHaveBeenCalled());
    await waitFor(() => expect(mockSync).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalled();
  });

  it("creates account on register tab", async () => {
    render(<ClientPortalAuthPanel authRailMode authTab="register" />);
    fireEvent.change(screen.getByTestId("client-portal-email"), {
      target: { value: "new@test.example" },
    });
    fireEvent.change(screen.getByTestId("client-portal-password"), {
      target: { value: "secret123" },
    });
    fireEvent.change(screen.getByTestId("client-portal-password-confirm"), {
      target: { value: "secret123" },
    });
    fireEvent.click(screen.getByTestId("client-portal-email-submit"));

    await waitFor(() => expect(createUserWithEmailAndPassword).toHaveBeenCalled());
    await waitFor(() => expect(sendEmailVerification).toHaveBeenCalled());
    await waitFor(() => expect(signOut).toHaveBeenCalled());
    expect(mockSync).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it("syncs profile after Google popup sign-in", async () => {
    render(<ClientPortalAuthPanel authRailMode />);
    fireEvent.click(screen.getByTestId("client-portal-google-signin"));
    await waitFor(() => expect(signInWithPopup).toHaveBeenCalled());
    await waitFor(() => expect(mockSync).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalled();
  });
});
