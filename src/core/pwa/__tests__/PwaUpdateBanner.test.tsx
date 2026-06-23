import { fireEvent, render, screen } from "@/test-utils/render";
import PwaUpdateBanner from "@/core/pwa/PwaUpdateBanner";

describe("PwaUpdateBanner", () => {
  it("affiche les libellés i18n et déclenche reload / dismiss", () => {
    const onReload = jest.fn();
    const onDismiss = jest.fn();
    render(<PwaUpdateBanner visible onReload={onReload} onDismiss={onDismiss} />);

    expect(screen.getByTestId("pwa-update-banner")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("pwa-update-banner-later"));
    expect(onDismiss).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("pwa-update-banner-update"));
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it("ne rend rien quand invisible", () => {
    render(<PwaUpdateBanner visible={false} onReload={jest.fn()} />);
    expect(screen.queryByTestId("pwa-update-banner")).not.toBeInTheDocument();
  });
});
