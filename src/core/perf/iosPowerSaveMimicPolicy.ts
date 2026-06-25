const STORAGE_KEY = "crmslot:lpm";

/** FPS cible quand `?lpm=1` (proche du bridage WebKit en mode économie d’énergie). */
export const IOS_POWER_SAVE_MIMIC_DEFAULT_FPS = 30;

export function parseIosPowerSaveMimicFps(search: string, stored: string | null): number | null {
  const params = new URLSearchParams(search);
  const query = params.get("lpm")?.trim();
  if (query === "1" || query === "true") return IOS_POWER_SAVE_MIMIC_DEFAULT_FPS;
  if (query && /^\d{1,2}$/.test(query)) {
    const fps = Number.parseInt(query, 10);
    if (fps >= 10 && fps <= 60) return fps;
  }
  if (stored === "1") return IOS_POWER_SAVE_MIMIC_DEFAULT_FPS;
  if (stored && /^\d{1,2}$/.test(stored)) {
    const fps = Number.parseInt(stored, 10);
    if (fps >= 10 && fps <= 60) return fps;
  }
  return null;
}

/** Mimic mode économie d’énergie iOS — `?lpm=1` ou `?lpm=30` · localStorage `crmslot:lpm`. */
export function resolveIosPowerSaveMimicFps(
  search: string = typeof window !== "undefined" ? window.location.search : "",
  storage: Pick<Storage, "getItem" | "setItem"> | null = typeof window !== "undefined"
    ? window.localStorage
    : null
): number | null {
  if (process.env.NEXT_PUBLIC_IOS_POWER_SAVE_MIMIC === "true") {
    return IOS_POWER_SAVE_MIMIC_DEFAULT_FPS;
  }

  try {
    const params = new URLSearchParams(search);
    const query = params.get("lpm")?.trim();
    if (query === "1" || query === "true") {
      storage?.setItem(STORAGE_KEY, "1");
      return IOS_POWER_SAVE_MIMIC_DEFAULT_FPS;
    }
    if (query && /^\d{1,2}$/.test(query)) {
      const fps = Number.parseInt(query, 10);
      if (fps >= 10 && fps <= 60) {
        storage?.setItem(STORAGE_KEY, String(fps));
        return fps;
      }
    }
    return parseIosPowerSaveMimicFps(search, storage?.getItem(STORAGE_KEY) ?? null);
  } catch {
    return null;
  }
}

export function disableIosPowerSaveMimic(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
