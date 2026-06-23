"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { isPwaStandalone } from "@/core/pwa/isPwaStandalone";
import {
  hasPwaAutoReloadAttempted,
  markPwaAutoReloadAttempted,
  markPwaGitShaStored,
  purgePwaServiceWorkersAndCaches,
  readDeployedGitSha,
  readStoredPwaGitSha,
} from "@/core/pwa/pwaBundleUpdate";

const PwaUpdateBanner = dynamic(() => import("@/core/pwa/PwaUpdateBanner"), { ssr: false });

/**
 * iOS PWA garde souvent l'ancien bundle Workbox après deploy.
 * Bannière utilisateur puis purge caches + reload (secours auto si bannière absente).
 */
export default function PwaStaleBundleGuard() {
  const [updateVisible, setUpdateVisible] = useState(false);
  const [deployedSha, setDeployedSha] = useState<string | null>(null);

  const applyUpdate = useCallback(async () => {
    if (!deployedSha) return;
    markPwaAutoReloadAttempted(deployedSha);
    try {
      await purgePwaServiceWorkersAndCaches();
    } catch {
      /* best-effort */
    } finally {
      markPwaGitShaStored(deployedSha);
      window.location.reload();
    }
  }, [deployedSha]);

  useEffect(() => {
    if (!isPwaStandalone()) return;

    const sha = readDeployedGitSha();
    if (!sha) return;

    const storedSha = readStoredPwaGitSha();
    if (storedSha === sha) return;

    if (hasPwaAutoReloadAttempted(sha)) {
      markPwaGitShaStored(sha);
      return;
    }

    setDeployedSha(sha);
    setUpdateVisible(true);
  }, []);

  if (!updateVisible || !deployedSha) return null;

  return (
    <PwaUpdateBanner
      visible
      onReload={() => void applyUpdate()}
      onDismiss={() => setUpdateVisible(false)}
    />
  );
}
