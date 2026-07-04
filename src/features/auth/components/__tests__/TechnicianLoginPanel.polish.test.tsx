import { fireEvent, screen, waitFor } from "@testing-library/react";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import TechnicianLoginPanel from "@/features/auth/components/TechnicianLoginPanel";
import { render } from "@/test-utils/render";

jest.mock("@/core/native/capacitorRuntime", () => ({
  isCapacitorNative: jest.fn(() => false),
}));

const { isCapacitorNative } = jest.requireMock("@/core/native/capacitorRuntime") as {
  isCapacitorNative: jest.Mock;
};

describe("TechnicianLoginPanel — polish (login UI propre + branding)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isCapacitorNative.mockReturnValue(false);
  });

  it("affiche logo + titres", () => {
    render(<TechnicianLoginPanel />);
    expect(screen.getByAltText(/CRMSLOT/)).toBeInTheDocument();
  });

  it("toggle show/hide password", () => {
    render(<TechnicianLoginPanel />);
    const input = screen.getByTestId("technician-login-password") as HTMLInputElement;
    expect(input.type).toBe("password");
    fireEvent.click(screen.getByTestId("technician-login-password-toggle"));
    expect(input.type).toBe("text");
    fireEvent.click(screen.getByTestId("technician-login-password-toggle"));
    expect(input.type).toBe("password");
  });

  it("affiche error inline si submit sans email", async () => {
    render(<TechnicianLoginPanel />);
    fireEvent.click(screen.getByTestId("technician-login-submit"));
    await waitFor(() => expect(screen.getByTestId("technician-login-error")).toBeInTheDocument());
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("affiche error inline si submit sans password", async () => {
    render(<TechnicianLoginPanel />);
    fireEvent.change(screen.getByTestId("technician-login-email"), {
      target: { value: "tech@example.com" },
    });
    fireEvent.click(screen.getByTestId("technician-login-submit"));
    await waitFor(() => expect(screen.getByTestId("technician-login-error")).toBeInTheDocument());
  });

  it("bouton 'forgot' déclenche sendPasswordResetEmail si email rempli", async () => {
    render(<TechnicianLoginPanel />);
    fireEvent.change(screen.getByTestId("technician-login-email"), {
      target: { value: "tech@example.com" },
    });
    fireEvent.click(screen.getByTestId("technician-login-forgot"));
    await waitFor(() =>
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        "tech@example.com",
        expect.objectContaining({
          url: expect.stringMatching(/\/$/),
          handleCodeInApp: false,
        })
      )
    );
  });

  it("bouton 'forgot' sans email → error inline (pas d'envoi)", async () => {
    render(<TechnicianLoginPanel />);
    fireEvent.click(screen.getByTestId("technician-login-forgot"));
    await waitFor(() => expect(screen.getByTestId("technician-login-error")).toBeInTheDocument());
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("bouton 'forgot' affiche l'erreur Firebase domaine non autorisé", async () => {
    (sendPasswordResetEmail as jest.Mock).mockRejectedValueOnce({
      code: "auth/unauthorized-continue-uri",
    });
    render(<TechnicianLoginPanel />);
    fireEvent.change(screen.getByTestId("technician-login-email"), {
      target: { value: "tech@example.com" },
    });
    fireEvent.click(screen.getByTestId("technician-login-forgot"));
    await waitFor(() => {
      expect(screen.getByTestId("technician-login-error")).toHaveTextContent(
        /Domaine non autorisé/i
      );
    });
  });

  it("n'affiche pas de raccourci démo (web ni Capacitor)", () => {
    isCapacitorNative.mockReturnValue(false);
    render(<TechnicianLoginPanel />);
    expect(screen.queryByTestId("technician-login-demo")).not.toBeInTheDocument();

    isCapacitorNative.mockReturnValue(true);
    render(<TechnicianLoginPanel />);
    expect(screen.queryByTestId("technician-login-demo")).not.toBeInTheDocument();
  });

  it("efface l'error inline quand l'utilisateur soumet à nouveau correctement", async () => {
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({ user: { uid: "u1" } });
    render(<TechnicianLoginPanel />);
    // 1er submit incomplet → error visible
    fireEvent.click(screen.getByTestId("technician-login-submit"));
    await waitFor(() => expect(screen.getByTestId("technician-login-error")).toBeInTheDocument());
    // remplit puis re-submit → error nettoyée
    fireEvent.change(screen.getByTestId("technician-login-email"), {
      target: { value: "tech@example.com" },
    });
    fireEvent.change(screen.getByTestId("technician-login-password"), {
      target: { value: "pwd123" },
    });
    fireEvent.click(screen.getByTestId("technician-login-submit"));
    await waitFor(() =>
      expect(screen.queryByTestId("technician-login-error")).not.toBeInTheDocument()
    );
  });
});
