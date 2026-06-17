import { fireEvent, render, screen } from "@/test-utils/render";
import CrmBrandOAuthButton from "@/features/auth/components/CrmBrandOAuthButton";

describe("CrmBrandOAuthButton", () => {
  it("renders google variant with label and icon slot", () => {
    render(
      <CrmBrandOAuthButton
        variant="google"
        testId="oauth-google"
        label="Se connecter avec Google"
        onClick={jest.fn()}
      />
    );

    const button = screen.getByTestId("oauth-google");
    expect(button).toHaveAttribute("data-oauth-variant", "google");
    expect(button).toHaveTextContent("Se connecter avec Google");
    expect(button).toHaveClass("rounded-xl");
  });

  it("calls onClick for apple variant", () => {
    const onClick = jest.fn();
    render(
      <CrmBrandOAuthButton
        variant="apple"
        testId="oauth-apple"
        label="Se connecter avec Apple"
        onClick={onClick}
      />
    );

    fireEvent.click(screen.getByTestId("oauth-apple"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
