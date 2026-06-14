/** Google Analytics 4 — no-op sans `NEXT_PUBLIC_GA4_MEASUREMENT_ID`. */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function ga4Enabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim());
}

let ga4Initialized = false;

export function initGa4Client(): void {
  const id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim();
  if (!id || typeof window === "undefined" || ga4Initialized) return;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", id, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);

  ga4Initialized = true;
}

export function ga4TrackEvent(
  name: string,
  params?: Record<string, string | number | boolean>
): void {
  if (!ga4Enabled() || typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params ?? {});
}
