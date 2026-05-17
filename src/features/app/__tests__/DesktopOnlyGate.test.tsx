/** @jest-environment jsdom */

import { render, screen } from "@/test-utils/render";
import DesktopOnlyGate, { isPhoneClassDevice } from "@/features/app/DesktopOnlyGate";

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

describe("DesktopOnlyGate", () => {
  it("renders children in dev preview mode", () => {
    render(
      <DesktopOnlyGate>
        <span data-testid="child">ok</span>
      </DesktopOnlyGate>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
