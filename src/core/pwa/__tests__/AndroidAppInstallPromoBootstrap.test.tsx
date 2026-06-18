import React from "react";
import { act, render, screen } from "@testing-library/react";
import { I18nProvider } from "@/core/i18n/I18nContext";
import AndroidAppInstallPromoBootstrap from "@/core/pwa/AndroidAppInstallPromoBootstrap";

const mockUseAndroidAppInstallPromo = jest.fn();

jest.mock("@/core/pwa/useAndroidAppInstallPromo", () => ({
  useAndroidAppInstallPromo: (...args: unknown[]) => mockUseAndroidAppInstallPromo(...args),
}));

jest.mock("sonner", () => ({
  toast: {
    message: jest.fn(),
    success: jest.fn(),
  },
}));

const { toast } = jest.requireMock("sonner") as {
  toast: { message: jest.Mock; success: jest.Mock };
};

function renderPromo(ui: React.ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe("AndroidAppInstallPromoBootstrap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUseAndroidAppInstallPromo.mockReturnValue({
      eligible: true,
      hasNativePrompt: true,
      install: jest.fn(async () => "accepted"),
      dismiss: jest.fn(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows a toast on demande after delay", () => {
    renderPromo(<AndroidAppInstallPromoBootstrap surface="demande" presentation="toast" />);
    expect(toast.message).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(1_500);
    });
    expect(toast.message).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ id: "android-install-promo-demande" })
    );
  });

  it("opens admin dialog after delay", () => {
    renderPromo(<AndroidAppInstallPromoBootstrap surface="admin" presentation="dialog" />);
    act(() => {
      jest.advanceTimersByTime(1_500);
    });
    expect(screen.getByTestId("android-install-promo-dialog-admin")).toBeInTheDocument();
  });
});
