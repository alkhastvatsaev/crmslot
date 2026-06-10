"use client";

import { useEffect } from "react";
import { reportClientError } from "@/core/monitoring/sentry";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, { digest: error.digest, boundary: "app/global-error" });
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          fontFamily: "system-ui, sans-serif",
          background: "#f8fafc",
          color: "#0f172a",
          textAlign: "center",
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Une erreur est survenue</h1>
        <p style={{ maxWidth: 420, fontSize: 14, color: "#64748b" }}>
          L&apos;application n&apos;a pas pu démarrer correctement. Réessayez ou rechargez la page.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            borderRadius: 8,
            background: "#0f172a",
            color: "#fff",
            padding: "8px 16px",
            fontSize: 14,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
