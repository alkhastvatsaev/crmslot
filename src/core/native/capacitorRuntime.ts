export function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

export function getCapacitorPlatform(): "ios" | "android" | "web" {
  if (typeof window === "undefined") return "web";
  const cap = (
    window as unknown as { Capacitor?: { getPlatform?: () => "ios" | "android" | "web" } }
  ).Capacitor;
  return cap?.getPlatform?.() ?? "web";
}
