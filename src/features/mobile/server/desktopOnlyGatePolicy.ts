/** Politique DesktopOnlyGate — logique pure (testable sans React). */

export function shouldBypassDesktopOnlyGate(
  devUiPreviewEnabled: boolean,
  buildTimeMobileAccessAllowed: boolean,
  runtimeMobileAccessAllowed: boolean | null = null
): boolean {
  if (devUiPreviewEnabled || buildTimeMobileAccessAllowed) return true;
  return runtimeMobileAccessAllowed === true;
}

export function shouldBlockPhoneOnDesktopOnlyGate(
  devUiPreviewEnabled: boolean,
  buildTimeMobileAccessAllowed: boolean,
  isPhone: boolean,
  runtimeMobileAccessAllowed: boolean | null = null
): boolean {
  if (!isPhone) return false;
  return !shouldBypassDesktopOnlyGate(
    devUiPreviewEnabled,
    buildTimeMobileAccessAllowed,
    runtimeMobileAccessAllowed
  );
}

/** Bootstrap runtime via GET /api/mobile/config (prod sans rebuild client). */
export async function resolveRuntimeMobileAccessAllowed(
  fetchConfig: () => Promise<{ mobileAccessAllowed: boolean } | null>
): Promise<boolean> {
  const cfg = await fetchConfig();
  return cfg?.mobileAccessAllowed === true;
}
