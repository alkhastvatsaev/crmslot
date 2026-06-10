import { render, screen, fireEvent } from "@/test-utils/render";
import MobileTopBar from "@/features/dashboard/components/MobileTopBar";

jest.mock("@/features/dashboard/components/UserProfile", () => ({
  __esModule: true,
  default: () => <div data-testid="user-profile">profile</div>,
}));

describe("MobileTopBar", () => {
  it("affiche le bouton avec le profil", () => {
    render(<MobileTopBar />);
    expect(screen.getByTestId("mobile-top-bar")).toBeInTheDocument();
    expect(screen.getByTestId("user-profile")).toBeInTheDocument();
  });

  it("appelle onToggle au clic", () => {
    const onToggle = jest.fn();
    render(<MobileTopBar onToggle={onToggle} />);
    fireEvent.click(screen.getByTestId("mobile-top-bar"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
