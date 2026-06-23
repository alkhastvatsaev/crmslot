"use client";

import { useEffect } from "react";
import { isRecoverableClientBootError, runPwaBootRecovery } from "@/core/pwa/pwaBootRecovery";
import { readDeployedGitSha } from "@/core/pwa/pwaBundleUpdate";

/** Écoute ChunkLoadError + mismatch SHA après hydratation (secours du script beforeInteractive). */
export default function PwaBootRecovery() {
  useEffect(() => {
    const deployedSha = readDeployedGitSha();
    if (!deployedSha) return;

    const onError = (event: ErrorEvent) => {
      const message = event.message || String(event.error ?? "");
      if (!isRecoverableClientBootError(message)) return;
      void runPwaBootRecovery(deployedSha);
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "";
      if (!isRecoverableClientBootError(message)) return;
      void runPwaBootRecovery(deployedSha);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
