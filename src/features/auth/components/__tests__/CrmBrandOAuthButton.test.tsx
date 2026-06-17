import { fireEvent, render, screen } from "@/test-utils/render";
import CrmBrandOAuthButton from "@/features/auth/components/CrmBrandOAuthButton";

describe("CrmBrandOAuthButton", () => {
  it("renders google variant with real text label and icon", () => {
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
    expect(button.querySelector("svg")).toBeInTheDocument();
  });

  it("renders apple variant with system font label", () => {
    render(
      <CrmBrandOAuthButton
        variant="apple"
        testId="oauth-apple"
        label="Se connecter avec Apple"
        onClick={jest.fn()}
      />
    );

    const label = screen.getByText("Se connecter avec Apple");
    expect(label.tagName).toBe("SPAN");
    expect(label.getAttribute("style")).toContain("apple-system");
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
