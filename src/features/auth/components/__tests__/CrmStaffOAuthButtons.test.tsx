import { render, screen } from "@/test-utils/render";
import CrmStaffOAuthButtons from "@/features/auth/components/CrmStaffOAuthButtons";

jest.mock("@/features/auth/hooks/useIsIphoneClient", () => ({
  useIsIphoneClient: jest.fn(() => false),
}));

const mockUseIsIphoneClient = jest.requireMock("@/features/auth/hooks/useIsIphoneClient")
  .useIsIphoneClient as jest.Mock;

describe("CrmStaffOAuthButtons", () => {
  beforeEach(() => {
    mockUseIsIphoneClient.mockReturnValue(false);
  });

  it("affiche Google sur desktop et masque Apple", () => {
    render(
      <CrmStaffOAuthButtons variant="admin" onGoogleSignIn={jest.fn()} onAppleSignIn={jest.fn()} />
    );

    expect(screen.getByTestId("admin-login-google")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-login-apple")).not.toBeInTheDocument();
    expect(screen.getByTestId("admin-login-oauth")).toHaveAttribute("data-show-apple", "false");
  });

  it("affiche Apple uniquement sur iPhone", () => {
    mockUseIsIphoneClient.mockReturnValue(true);

    render(
      <CrmStaffOAuthButtons variant="admin" onGoogleSignIn={jest.fn()} onAppleSignIn={jest.fn()} />
    );

    expect(screen.getByTestId("admin-login-google")).toBeInTheDocument();
    expect(screen.getByTestId("admin-login-apple")).toBeInTheDocument();
    expect(screen.getByTestId("admin-login-oauth")).toHaveAttribute("data-show-apple", "true");
  });
});
