/** @jest-environment jsdom */

import { render, screen, waitFor } from "@/test-utils/render";
import DesktopOnlyGate, { isPhoneClassDevice } from "@/features/app/DesktopOnlyGate";
import { fetchMobileRuntimeConfig } from "@/features/mobile/fetchMobileRuntimeConfig";

jest.mock("@/core/config/mobileAccess", () => ({
  mobileAccessAllowed: false,
}));

jest.mock("@/features/mobile/fetchMobileRuntimeConfig", () => ({
  fetchMobileRuntimeConfig: jest.fn(),
}));

jest.mock("@/core/native/capacitorRuntime", () => ({
  isCapacitorNative: jest.fn(() => false),
}));

import { isCapacitorNative } from "@/core/native/capacitorRuntime";
const isCapacitorNativeMock = isCapacitorNative as jest.MockedFunction<typeof isCapacitorNative>;

const fetchMobileRuntimeConfigMock = fetchMobileRuntimeConfig as jest.MockedFunction<
  typeof fetchMobileRuntimeConfig
>;

describe("isPhoneClassDevice", () => {
  const originalUa = navigator.userAgent;

  afterEach(() => {
    Object.defineProperty(navigator, "userAgent", {
      value: originalUa,
      configurable: true,
    });
  });

  it("detects iPhone user agent", () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      configurable: true,
    });
    expect(isPhoneClassDevice()).toBe(true);
  });

  it("does not treat iPad as phone", () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)",
      configurable: true,
    });
    expect(isPhoneClassDevice()).toBe(false);
  });
});

describe("DesktopOnlyGate prod-like", () => {
  const originalUa = navigator.userAgent;

  beforeEach(() => {
    fetchMobileRuntimeConfigMock.mockReset();
    isCapacitorNativeMock.mockReturnValue(false);
  });

  afterEach(() => {
    Object.defineProperty(navigator, "userAgent", {
      value: originalUa,
      configurable: true,
    });
  });

  it("allows desktop user agent without calling runtime config", async () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      configurable: true,
    });

    render(
      <DesktopOnlyGate>
        <span data-testid="child">ok</span>
      </DesktopOnlyGate>
    );

    await waitFor(() => {
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
    expect(fetchMobileRuntimeConfigMock).not.toHaveBeenCalled();
  });

  it("allows phone when runtime config enables mobile access", async () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      configurable: true,
    });
    fetchMobileRuntimeConfigMock.mockResolvedValue({
      ok: true,
      mobileAccessAllowed: true,
      forceMobileQueryKey: "forceMobile",
      pwaServiceWorkerEnabled: false,
      gitSha: null,
      hubPageCount: 7,
      nodeEnv: "production",
      timestamp: "2026-06-07T00:00:00.000Z",
    });

    render(
      <DesktopOnlyGate>
        <span data-testid="child">ok</span>
      </DesktopOnlyGate>
    );

    await waitFor(() => {
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
    expect(fetchMobileRuntimeConfigMock).toHaveBeenCalledTimes(1);
  });

  it("bypasses gate when running inside Capacitor WebView", async () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Linux; Android 14)",
      configurable: true,
    });
    isCapacitorNativeMock.mockReturnValue(true);

    render(
      <DesktopOnlyGate>
        <span data-testid="child">ok</span>
      </DesktopOnlyGate>
    );

    await waitFor(() => {
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
    expect(fetchMobileRuntimeConfigMock).not.toHaveBeenCalled();
  });

  it("blocks phone when runtime config denies mobile access", async () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      configurable: true,
    });
    fetchMobileRuntimeConfigMock.mockResolvedValue({
      ok: true,
      mobileAccessAllowed: false,
      forceMobileQueryKey: "forceMobile",
      pwaServiceWorkerEnabled: false,
      gitSha: null,
      hubPageCount: 7,
      nodeEnv: "production",
      timestamp: "2026-06-07T00:00:00.000Z",
    });

    render(
      <DesktopOnlyGate>
        <span data-testid="child">ok</span>
      </DesktopOnlyGate>
    );

    await waitFor(() => {
      expect(screen.getByTestId("desktop-only-gate-blocked")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  });
});
