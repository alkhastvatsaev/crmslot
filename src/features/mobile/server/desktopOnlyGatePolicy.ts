/** Politique DesktopOnlyGate — logique pure (testable sans React). */

export function shouldBypassDesktopOnlyGate(
  buildTimeMobileAccessAllowed: boolean,
  runtimeMobileAccessAllowed: boolean | null = null
): boolean {
  if (buildTimeMobileAccessAllowed) return true;
  return runtimeMobileAccessAllowed === true;
}

export function shouldBlockPhoneOnDesktopOnlyGate(
  buildTimeMobileAccessAllowed: boolean,
  isPhone: boolean,
  runtimeMobileAccessAllowed: boolean | null = null
): boolean {
  if (!isPhone) return false;
  return !shouldBypassDesktopOnlyGate(buildTimeMobileAccessAllowed, runtimeMobileAccessAllowed);
}

/** Bootstrap runtime via GET /api/mobile/config (prod sans rebuild client). */
export async function resolveRuntimeMobileAccessAllowed(
  fetchConfig: () => Promise<{ mobileAccessAllowed: boolean } | null>
): Promise<boolean> {
  const cfg = await fetchConfig();
  return cfg?.mobileAccessAllowed === true;
}
