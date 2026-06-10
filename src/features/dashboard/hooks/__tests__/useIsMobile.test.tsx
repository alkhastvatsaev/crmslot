/** @jest-environment jsdom */

import { renderHook, waitFor } from "@testing-library/react";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";

describe("useIsMobile", () => {
  const originalUa = navigator.userAgent;
  const originalSearch = window.location.search;

  afterEach(() => {
    Object.defineProperty(navigator, "userAgent", {
      value: originalUa,
      configurable: true,
    });
    window.history.replaceState({}, "", `/${originalSearch ? originalSearch : ""}`);
  });

  it("retourne true avec ?forceMobile=1 sur desktop UA", async () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Macintosh; Intel Mac OS X)",
      configurable: true,
    });
    window.history.replaceState({}, "", "/?forceMobile=1");

    const { result } = renderHook(() => useIsMobile());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it("retourne true sur UA iPhone", async () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      configurable: true,
    });
    window.history.replaceState({}, "", "/");

    const { result } = renderHook(() => useIsMobile());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it("retourne false sur desktop sans override", async () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Macintosh; Intel Mac OS X)",
      configurable: true,
    });
    window.history.replaceState({}, "", "/");

    const { result } = renderHook(() => useIsMobile());
    await waitFor(() => expect(result.current).toBe(false));
  });
});
