import { renderHook, act } from "@testing-library/react";
import { useMobileMapRenderGate } from "@/features/map/useMobileMapRenderGate";

describe("useMobileMapRenderGate", () => {
  it("retourne false quand la page carte est aria-hidden", () => {
    const host = document.createElement("div");
    host.dataset.testid = "mobile-page-0";
    host.setAttribute("aria-hidden", "true");
    const map = document.createElement("div");
    host.appendChild(map);
    document.body.appendChild(host);

    const ref = { current: map };
    const { result } = renderHook(() => useMobileMapRenderGate(ref));

    act(() => {
      host.setAttribute("aria-hidden", "true");
    });

    expect(result.current).toBe(false);
    host.remove();
  });

  it("retourne false quand le rail carte hub est inactif", () => {
    const rail = document.createElement("div");
    rail.dataset.mobileHubRail = "left";
    rail.dataset.mobileHubRailActive = "false";
    const map = document.createElement("div");
    rail.appendChild(map);
    document.body.appendChild(rail);

    const ref = { current: map };
    const { result } = renderHook(() => useMobileMapRenderGate(ref));

    expect(result.current).toBe(false);
    rail.remove();
  });
});
