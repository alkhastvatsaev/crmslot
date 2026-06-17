import { fireEvent, screen, waitFor } from "@testing-library/react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import TechnicianLoginPanel from "@/features/auth/components/TechnicianLoginPanel";
import TechnicianLoginGate from "@/features/auth/components/TechnicianLoginGate";
import { render } from "@/test-utils/render";

describe("TechnicianLoginPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("blocks submit when email is missing", async () => {
    render(<TechnicianLoginPanel />);
    fireEvent.click(screen.getByTestId("technician-login-submit"));
    await waitFor(() => expect(signInWithEmailAndPassword).not.toHaveBeenCalled());
  });

  it("blocks submit when password is missing", async () => {
    render(<TechnicianLoginPanel />);
    fireEvent.change(screen.getByTestId("technician-login-email"), {
      target: { value: "tech@example.com" },
    });
    fireEvent.click(screen.getByTestId("technician-login-submit"));
    await waitFor(() => expect(signInWithEmailAndPassword).not.toHaveBeenCalled());
  });

  it("submits email and password to Firebase auth", async () => {
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
      user: { getIdToken: jest.fn().mockResolvedValue("tok") },
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, companyId: "co-abc" }),
    });
    render(<TechnicianLoginPanel />);

    fireEvent.change(screen.getByTestId("technician-login-email"), {
      target: { value: "tech@example.com" },
    });
    fireEvent.change(screen.getByTestId("technician-login-password"), {
      target: { value: "secret123" },
    });
    fireEvent.click(screen.getByTestId("technician-login-submit"));

    await waitFor(() =>
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "tech@example.com",
        "secret123"
      )
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/company/join-default",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("creates account on register tab", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, companyId: "co-abc" }),
    });
    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
      user: { getIdToken: jest.fn().mockResolvedValue("tok") },
    });

    render(<TechnicianLoginPanel />);
    fireEvent.click(screen.getByTestId("technician-login-tab-register"));
    fireEvent.change(screen.getByTestId("technician-login-first-name"), {
      target: { value: "Jean" },
    });
    fireEvent.change(screen.getByTestId("technician-login-last-name"), {
      target: { value: "Martin" },
    });
    fireEvent.change(screen.getByTestId("technician-login-email"), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByTestId("technician-login-password"), {
      target: { value: "secret123" },
    });
    fireEvent.change(screen.getByTestId("technician-login-confirm-password"), {
      target: { value: "secret123" },
    });
    fireEvent.click(screen.getByTestId("technician-login-submit"));

    await waitFor(() =>
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "new@example.com",
        "secret123"
      )
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/company/join-default",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          staffKind: "technician",
          firstName: "Jean",
          lastName: "Martin",
          email: "new@example.com",
        }),
      })
    );
  });
});

describe("TechnicianLoginGate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows login panel when user is anonymous", async () => {
    (onAuthStateChanged as jest.Mock).mockImplementation((_auth, cb) => {
      cb({ isAnonymous: true, uid: "anon" });
      return jest.fn();
    });

    render(
      <TechnicianLoginGate>
        <div data-testid="technician-app-body" />
      </TechnicianLoginGate>
    );

    await waitFor(() => expect(screen.getByTestId("technician-login-panel")).toBeInTheDocument());
    expect(screen.queryByTestId("technician-app-body")).not.toBeInTheDocument();
  });

  it("renders children when user is signed in", async () => {
    (onAuthStateChanged as jest.Mock).mockImplementation((_auth, cb) => {
      cb({ isAnonymous: false, uid: "tech-uid" });
      return jest.fn();
    });

    render(
      <TechnicianLoginGate>
        <div data-testid="technician-app-body" />
      </TechnicianLoginGate>
    );

    await waitFor(() => expect(screen.getByTestId("technician-app-body")).toBeInTheDocument());
  });
});
