import { render, screen } from "@/test-utils/render";
import CrmStaffOAuthButtons from "@/features/auth/components/CrmStaffOAuthButtons";

jest.mock("@/features/auth/hooks/useIsIphoneClient", () => ({
  useIsAppleOAuthClient: jest.fn(() => false),
  useIsIphoneClient: jest.fn(() => false),
}));

const mockUseIsAppleOAuthClient = jest.requireMock("@/features/auth/hooks/useIsIphoneClient")
  .useIsAppleOAuthClient as jest.Mock;

describe("CrmStaffOAuthButtons", () => {
  beforeEach(() => {
    mockUseIsAppleOAuthClient.mockReturnValue(false);
  });

  it("affiche les libellés connexion sur l’onglet login", () => {
    render(
      <CrmStaffOAuthButtons
        variant="admin"
        authTab="login"
        onGoogleSignIn={jest.fn()}
        onAppleSignIn={jest.fn()}
      />
    );

    expect(screen.getByTestId("admin-login-oauth")).toHaveAttribute("data-oauth-mode", "login");
    expect(screen.getByText("Se connecter avec Google")).toBeInTheDocument();
  });

  it("affiche les libellés inscription sur l’onglet register", () => {
    render(
      <CrmStaffOAuthButtons
        variant="admin"
        authTab="register"
        onGoogleSignIn={jest.fn()}
        onAppleSignIn={jest.fn()}
      />
    );

    expect(screen.getByTestId("admin-login-oauth")).toHaveAttribute("data-oauth-mode", "register");
    expect(screen.getByText("Créer un compte avec Google")).toBeInTheDocument();
  });

  it("masque Apple hors écosystème Apple", () => {
    render(
      <CrmStaffOAuthButtons
        variant="admin"
        authTab="login"
        onGoogleSignIn={jest.fn()}
        onAppleSignIn={jest.fn()}
      />
    );

    expect(screen.queryByTestId("admin-login-apple")).not.toBeInTheDocument();
    expect(screen.getByTestId("admin-login-oauth")).toHaveAttribute("data-show-apple", "false");
  });

  it("affiche Apple sur Mac ou iPhone", () => {
    mockUseIsAppleOAuthClient.mockReturnValue(true);

    render(
      <CrmStaffOAuthButtons
        variant="admin"
        authTab="login"
        onGoogleSignIn={jest.fn()}
        onAppleSignIn={jest.fn()}
      />
    );

    expect(screen.getByTestId("admin-login-apple")).toBeInTheDocument();
    expect(screen.getByTestId("admin-login-oauth")).toHaveAttribute("data-show-apple", "true");
  });
});
