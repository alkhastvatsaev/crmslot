import React from "react";
import { act, render } from "@testing-library/react";
import AndroidAppInstallPromoBootstrap from "@/core/pwa/AndroidAppInstallPromoBootstrap";

const mockUseAndroidAppInstallPromo = jest.fn();

jest.mock("@/core/pwa/useAndroidAppInstallPromo", () => ({
  useAndroidAppInstallPromo: (...args: unknown[]) => mockUseAndroidAppInstallPromo(...args),
}));

describe("AndroidAppInstallPromoBootstrap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUseAndroidAppInstallPromo.mockReturnValue({
      hasNativePrompt: false,
      install: jest.fn(async () => "accepted"),
      dismiss: jest.fn(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders nothing (no in-app install UI)", () => {
    const { container } = render(<AndroidAppInstallPromoBootstrap surface="admin" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("does not call install without Chrome beforeinstallprompt", () => {
    const install = jest.fn(async () => "accepted");
    mockUseAndroidAppInstallPromo.mockReturnValue({
      hasNativePrompt: false,
      install,
      dismiss: jest.fn(),
    });

    render(<AndroidAppInstallPromoBootstrap surface="admin" />);
    act(() => {
      jest.advanceTimersByTime(5_000);
    });
    expect(install).not.toHaveBeenCalled();
  });

  it("triggers native Chrome install prompt after delay when available", async () => {
    const install = jest.fn(async () => "accepted");
    mockUseAndroidAppInstallPromo.mockReturnValue({
      hasNativePrompt: true,
      install,
      dismiss: jest.fn(),
    });

    render(<AndroidAppInstallPromoBootstrap surface="admin" />);
    act(() => {
      jest.advanceTimersByTime(1_999);
    });
    expect(install).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(install).toHaveBeenCalledTimes(1);
  });

  it("persists dismiss when user declines native prompt", async () => {
    const dismiss = jest.fn();
    const install = jest.fn(async () => "dismissed");
    mockUseAndroidAppInstallPromo.mockReturnValue({
      hasNativePrompt: true,
      install,
      dismiss,
    });

    render(<AndroidAppInstallPromoBootstrap surface="demande" />);
    await act(async () => {
      jest.advanceTimersByTime(2_000);
    });
    expect(dismiss).toHaveBeenCalledTimes(1);
  });
});
