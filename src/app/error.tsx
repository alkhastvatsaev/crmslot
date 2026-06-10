"use client";

import { useEffect } from "react";
import { reportClientError } from "@/core/monitoring/sentry";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, { digest: error.digest, boundary: "app/error" });
  }, [error]);

  return (
    <main
      data-testid="app-error-boundary"
      className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center"
    >
      <h1 className="text-lg font-bold text-slate-900">Une erreur est survenue</h1>
      <p className="max-w-md text-sm text-slate-500">
        La page n&apos;a pas pu être affichée. Réessayez — si le problème persiste, rechargez
        l&apos;application.
      </p>
      <button
        type="button"
        data-testid="app-error-retry"
        onClick={reset}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
      >
        Réessayer
      </button>
    </main>
  );
}
