/** Retour haptique léger (dock mobile, envoi réussi). */
export function triggerRequesterMobileHaptic(style: "light" | "medium" = "light"): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  const ms = style === "medium" ? 18 : 10;
  try {
    navigator.vibrate(ms);
  } catch {
    /* ignore */
  }
}
