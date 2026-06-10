import { sentryEnabled, serverSentryDsn } from "@/core/monitoring/sentry";

/** Instrumentation serveur Next — Sentry uniquement si SENTRY_DSN configuré. */
export async function register(): Promise<void> {
  const dsn = serverSentryDsn();
  if (!sentryEnabled(dsn)) return;

  const Sentry = await import("@sentry/nextjs");
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    tracesSampleRate: 0.1,
  });
}

export async function onRequestError(...args: unknown[]): Promise<void> {
  if (!sentryEnabled(serverSentryDsn())) return;
  const Sentry = await import("@sentry/nextjs");
  // Délégué au handler officiel Sentry pour les erreurs RSC / route handlers.
  (Sentry.captureRequestError as (...a: unknown[]) => void)(...args);
}
