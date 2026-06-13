import { renderHook } from "@testing-library/react";
import { useRef } from "react";
import { useMobileHubPanelVisible } from "@/features/dashboard/hooks/useMobileHubPanelVisible";

describe("useMobileHubPanelVisible", () => {
  it("retourne false quand le panneau ancêtre est masqué", () => {
    const host = document.createElement("div");
    host.className = "mobile-screen-host-panel";
    host.setAttribute("aria-hidden", "true");

    const root = document.createElement("div");
    host.appendChild(root);
    document.body.appendChild(host);

    const { result } = renderHook(() => {
      const rootRef = useRef<HTMLDivElement>(root);
      return useMobileHubPanelVisible(rootRef);
    });

    expect(result.current).toBe(false);

    host.remove();
  });
});
