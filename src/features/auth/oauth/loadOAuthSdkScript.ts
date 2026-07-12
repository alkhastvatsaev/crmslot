const loaded = new Map<string, Promise<void>>();

/** Charge un script OAuth tiers une seule fois (Google GIS / Apple JS). */
export function loadOAuthSdkScript(src: string, id: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const existing = loaded.get(id);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`oauth_script_load_failed:${id}`));
    document.head.appendChild(script);
  });

  loaded.set(id, promise);
  return promise;
}
