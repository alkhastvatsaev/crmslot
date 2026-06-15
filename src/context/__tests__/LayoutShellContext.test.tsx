/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import {
  LayoutShellProvider,
  useLayoutShellMode,
  useMobileHubLayout,
} from "@/context/LayoutShellContext";

describe("LayoutShellContext", () => {
  it("defaults to desktop outside provider", () => {
    const { result } = renderHook(() => ({
      mode: useLayoutShellMode(),
      mobile: useMobileHubLayout(),
    }));
    expect(result.current.mode).toBe("desktop");
    expect(result.current.mobile).toBe(false);
  });

  it("reflects mobile provider mode", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LayoutShellProvider mode="mobile">{children}</LayoutShellProvider>
    );
    const { result } = renderHook(
      () => ({
        mode: useLayoutShellMode(),
        mobile: useMobileHubLayout(),
      }),
      { wrapper }
    );
    expect(result.current.mode).toBe("mobile");
    expect(result.current.mobile).toBe(true);
  });
});
