"use client";

import { useCallback, useEffect, useState } from "react";
import { reportClientError } from "@/core/monitoring/sentry";
import { purgePwaServiceWorkersAndCaches } from "@/core/pwa/pwaBundleUpdate";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    reportClientError(error, { digest: error.digest, boundary: "app/global-error" });
  }, [error]);

  const hardReload = useCallback(async () => {
    setClearing(true);
    try {
      await purgePwaServiceWorkersAndCaches();
    } catch {
      /* best-effort */
    } finally {
      window.location.reload();
    }
  }, []);

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
          L&apos;application n&apos;a pas pu démarrer correctement. Souvent après une mise à jour
          PWA — videz le cache puis rechargez.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
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
          <button
            type="button"
            onClick={() => void hardReload()}
            disabled={clearing}
            style={{
              borderRadius: 8,
              background: "#fff",
              color: "#0f172a",
              padding: "8px 16px",
              fontSize: 14,
              fontWeight: 700,
              border: "1px solid #cbd5e1",
              cursor: clearing ? "wait" : "pointer",
            }}
          >
            {clearing ? "Nettoyage…" : "Vider le cache PWA"}
          </button>
        </div>
      </body>
    </html>
  );
}
