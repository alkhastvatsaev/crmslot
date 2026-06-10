import { logger } from "@/core/logger";

/** Sentry n'est initialisé que si un DSN est configuré (sinon no-op complet). */
export function sentryEnabled(dsn: string | undefined | null): boolean {
  return typeof dsn === "string" && dsn.trim().length > 0;
}

export function clientSentryDsn(): string | undefined {
  return process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || undefined;
}

export function serverSentryDsn(): string | undefined {
  return process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || undefined;
}

/**
 * Rapporte une erreur runtime : toujours via le logger structuré,
 * et vers Sentry uniquement si le DSN client est configuré.
 */
export function reportClientError(error: unknown, context?: Record<string, unknown>): void {
  logger.error("[monitoring] Unhandled error", {
    error: error instanceof Error ? error.message : String(error),
    ...context,
  });
  if (!sentryEnabled(clientSentryDsn())) return;
  void import("@sentry/nextjs")
    .then((sentry) => {
      sentry.captureException(error, context ? { extra: context } : undefined);
    })
    .catch(() => {
      // Sentry indisponible — le logger a déjà tracé l'erreur.
    });
}
