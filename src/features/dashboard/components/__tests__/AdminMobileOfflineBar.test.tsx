import { fireEvent, render, screen } from "@/test-utils/render";
import AdminMobileOfflineBar from "@/features/dashboard/components/AdminMobileOfflineBar";

describe("AdminMobileOfflineBar", () => {
  it("s'affiche hors ligne", () => {
    Object.defineProperty(window.navigator, "onLine", { configurable: true, value: false });
    render(<AdminMobileOfflineBar />);
    expect(screen.getByTestId("admin-mobile-offline-bar")).toBeInTheDocument();
    Object.defineProperty(window.navigator, "onLine", { configurable: true, value: true });
  });

  it("se masque en ligne", () => {
    Object.defineProperty(window.navigator, "onLine", { configurable: true, value: true });
    render(<AdminMobileOfflineBar />);
    expect(screen.queryByTestId("admin-mobile-offline-bar")).not.toBeInTheDocument();
  });
});
