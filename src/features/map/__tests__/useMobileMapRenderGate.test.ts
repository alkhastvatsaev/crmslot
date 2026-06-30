import { renderHook, waitFor } from "@/test-utils/render";
import { useMobileMapRenderGate } from "@/features/map/useMobileMapRenderGate";

describe("useMobileMapRenderGate", () => {
  it("reste inactif tant que le conteneur carte n'est pas monté", async () => {
    const { result, rerender } = renderHook(
      ({ container }: { container: HTMLDivElement | null }) => useMobileMapRenderGate(container),
      { initialProps: { container: null as HTMLDivElement | null } }
    );

    expect(result.current).toBe(false);

    const page = document.createElement("div");
    page.dataset.testid = "mobile-page-0";
    const rail = document.createElement("div");
    rail.dataset.mobileHubRail = "left";
    rail.dataset.mobileHubRailActive = "true";
    const map = document.createElement("div");
    rail.appendChild(map);
    page.appendChild(rail);
    document.body.appendChild(page);

    rerender({ container: map });

    await waitFor(() => expect(result.current).toBe(true));

    page.remove();
  });
});
