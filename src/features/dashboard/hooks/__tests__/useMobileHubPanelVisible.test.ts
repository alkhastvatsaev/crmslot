import { renderHook } from "@testing-library/react";
import { useMobileHubPanelVisible } from "@/features/dashboard/hooks/useMobileHubPanelVisible";

describe("useMobileHubPanelVisible", () => {
  it("retourne false quand le panneau ancêtre est masqué", () => {
    const host = document.createElement("div");
    host.className = "mobile-screen-host-panel";
    host.setAttribute("aria-hidden", "true");

    const root = document.createElement("div");
    host.appendChild(root);
    document.body.appendChild(host);

    const { result } = renderHook(() => useMobileHubPanelVisible(root));

    expect(result.current).toBe(false);

    host.remove();
  });
});
