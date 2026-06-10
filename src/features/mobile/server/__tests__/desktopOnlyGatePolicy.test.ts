import {
  resolveRuntimeMobileAccessAllowed,
  shouldBlockPhoneOnDesktopOnlyGate,
  shouldBypassDesktopOnlyGate,
} from "@/features/mobile/server/desktopOnlyGatePolicy";

describe("desktopOnlyGatePolicy", () => {
  it("bypass si preview dev ou ALLOW_MOBILE build-time", () => {
    expect(shouldBypassDesktopOnlyGate(true, false)).toBe(true);
    expect(shouldBypassDesktopOnlyGate(false, true)).toBe(true);
    expect(shouldBypassDesktopOnlyGate(false, false)).toBe(false);
  });

  it("bypass si config runtime API autorise le mobile", () => {
    expect(shouldBypassDesktopOnlyGate(false, false, true)).toBe(true);
    expect(shouldBypassDesktopOnlyGate(false, false, false)).toBe(false);
    expect(shouldBypassDesktopOnlyGate(false, false, null)).toBe(false);
  });

  it("bloque iPhone en prod sans ALLOW_MOBILE", () => {
    expect(shouldBlockPhoneOnDesktopOnlyGate(false, false, true)).toBe(true);
    expect(shouldBlockPhoneOnDesktopOnlyGate(false, true, true)).toBe(false);
    expect(shouldBlockPhoneOnDesktopOnlyGate(false, false, false)).toBe(false);
    expect(shouldBlockPhoneOnDesktopOnlyGate(false, false, true, true)).toBe(false);
    expect(shouldBlockPhoneOnDesktopOnlyGate(false, false, true, false)).toBe(true);
  });

  it("resolveRuntimeMobileAccessAllowed lit mobileAccessAllowed", async () => {
    await expect(
      resolveRuntimeMobileAccessAllowed(async () => ({ mobileAccessAllowed: true }))
    ).resolves.toBe(true);
    await expect(
      resolveRuntimeMobileAccessAllowed(async () => ({ mobileAccessAllowed: false }))
    ).resolves.toBe(false);
    await expect(resolveRuntimeMobileAccessAllowed(async () => null)).resolves.toBe(false);
  });
});
