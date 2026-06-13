/** PostHog — no-op si `NEXT_PUBLIC_POSTHOG_KEY` absent. */

export function posthogEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim());
}

export function captureEvent(
  event: string,
  properties?: Record<string, string | number | boolean>
): void {
  if (!posthogEnabled() || typeof window === "undefined") return;
  void import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.capture(event, properties);
    })
    .catch(() => {
      // Analytics ne doit jamais casser l'UI.
    });
}

export function initPosthogClient(): void {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!key || typeof window === "undefined") return;
  void import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://eu.i.posthog.com",
        capture_pageview: true,
        capture_pageleave: true,
      });
    })
    .catch(() => {});
}
