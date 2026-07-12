import { render, screen } from "@/test-utils/render";
import CrmStaffOAuthButtons from "@/features/auth/components/CrmStaffOAuthButtons";

describe("CrmStaffOAuthButtons", () => {
  it("affiche les libellés connexion sur l’onglet login", () => {
    render(<CrmStaffOAuthButtons variant="admin" authTab="login" onGoogleSignIn={jest.fn()} />);

    expect(screen.getByTestId("admin-login-oauth")).toHaveAttribute("data-oauth-mode", "login");
    expect(screen.getByRole("button", { name: "Se connecter avec Google" })).toBeInTheDocument();
  });

  it("affiche les libellés inscription sur l’onglet register", () => {
    render(<CrmStaffOAuthButtons variant="admin" authTab="register" onGoogleSignIn={jest.fn()} />);

    expect(screen.getByTestId("admin-login-oauth")).toHaveAttribute("data-oauth-mode", "register");
    expect(screen.getByRole("button", { name: "Créer un compte avec Google" })).toBeInTheDocument();
  });

  it("n’affiche pas Apple (Developer Program requis)", () => {
    render(<CrmStaffOAuthButtons variant="admin" authTab="login" onGoogleSignIn={jest.fn()} />);

    expect(screen.queryByTestId("admin-login-apple")).not.toBeInTheDocument();
    expect(screen.getByTestId("admin-login-oauth")).toHaveAttribute("data-show-apple", "false");
  });
});
