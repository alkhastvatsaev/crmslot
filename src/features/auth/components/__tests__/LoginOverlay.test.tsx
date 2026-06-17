import { fireEvent, screen, waitFor } from "@testing-library/react";
import { onAuthStateChanged } from "firebase/auth";
import LoginOverlay from "@/features/auth/components/LoginOverlay";
import { render } from "@/test-utils/render";

describe("LoginOverlay (admin)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows admin login panel when user is not signed in", async () => {
    (onAuthStateChanged as jest.Mock).mockImplementation((_auth, cb) => {
      cb(null);
      return jest.fn();
    });

    render(
      <LoginOverlay>
        <div data-testid="admin-dashboard-body" />
      </LoginOverlay>
    );

    await waitFor(() => expect(screen.getByTestId("admin-login-panel")).toBeInTheDocument());
    expect(screen.queryByTestId("admin-dashboard-body")).not.toBeInTheDocument();
  });

  it("renders children when user is signed in", async () => {
    (onAuthStateChanged as jest.Mock).mockImplementation((_auth, cb) => {
      cb({ isAnonymous: false, uid: "admin-uid" });
      return jest.fn();
    });

    render(
      <LoginOverlay>
        <div data-testid="admin-dashboard-body" />
      </LoginOverlay>
    );

    await waitFor(() => expect(screen.getByTestId("admin-dashboard-body")).toBeInTheDocument());
  });

  it("shows admin titles on login panel", async () => {
    (onAuthStateChanged as jest.Mock).mockImplementation((_auth, cb) => {
      cb(null);
      return jest.fn();
    });

    render(
      <LoginOverlay>
        <div />
      </LoginOverlay>
    );

    await waitFor(() => {
      expect(screen.getByText("Espace administrateur")).toBeInTheDocument();
      expect(
        screen.getByText("Connectez-vous pour accéder au tableau de bord")
      ).toBeInTheDocument();
    });
  });

  it("blocks submit when email is missing", async () => {
    (onAuthStateChanged as jest.Mock).mockImplementation((_auth, cb) => {
      cb(null);
      return jest.fn();
    });

    render(
      <LoginOverlay>
        <div />
      </LoginOverlay>
    );

    await waitFor(() => expect(screen.getByTestId("admin-login-panel")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("admin-login-submit"));
    await waitFor(() => expect(screen.getByTestId("admin-login-error")).toBeInTheDocument());
  });

  it("shows register tab with confirm password field", async () => {
    (onAuthStateChanged as jest.Mock).mockImplementation((_auth, cb) => {
      cb(null);
      return jest.fn();
    });

    render(
      <LoginOverlay>
        <div />
      </LoginOverlay>
    );

    await waitFor(() => expect(screen.getByTestId("admin-login-tab-register")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("admin-login-tab-register"));
    expect(screen.getByTestId("admin-login-confirm-password")).toBeInTheDocument();
  });

  it("shows Google OAuth button on desktop", async () => {
    Object.defineProperty(window.navigator, "userAgent", {
      value: "Mozilla/5.0 (Macintosh; Intel Mac OS X)",
      configurable: true,
    });

    (onAuthStateChanged as jest.Mock).mockImplementation((_auth, cb) => {
      cb(null);
      return jest.fn();
    });

    render(
      <LoginOverlay>
        <div />
      </LoginOverlay>
    );

    await waitFor(() => expect(screen.getByTestId("admin-login-oauth")).toBeInTheDocument());
    expect(screen.getByTestId("admin-login-google")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-login-apple")).not.toBeInTheDocument();
  });
});
