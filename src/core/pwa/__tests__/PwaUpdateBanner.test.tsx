import { fireEvent, render, screen } from "@/test-utils/render";
import PwaUpdateBanner from "@/core/pwa/PwaUpdateBanner";

describe("PwaUpdateBanner", () => {
  it("affiche la bannière et déclenche onReload", () => {
    const onReload = jest.fn();
    render(<PwaUpdateBanner visible onReload={onReload} onDismiss={jest.fn()} />);

    expect(screen.getByTestId("pwa-update-banner")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /mettre à jour/i }));
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it("n'affiche rien si visible=false", () => {
    render(<PwaUpdateBanner visible={false} onReload={jest.fn()} />);
    expect(screen.queryByTestId("pwa-update-banner")).not.toBeInTheDocument();
  });
});
