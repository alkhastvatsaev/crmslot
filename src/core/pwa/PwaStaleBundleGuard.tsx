"use client";

import { useEffect } from "react";
import { isPwaStandalone } from "@/core/pwa/isPwaStandalone";

const STORAGE_KEY = "crmslot:pwa-git-sha";

function readDeployedGitSha(): string | null {
  const fromMeta = document
    .querySelector('meta[name="application-git-sha"]')
    ?.getAttribute("content")
    ?.trim();
  if (fromMeta) return fromMeta;
  return process.env.NEXT_PUBLIC_APP_GIT_SHA?.trim() || null;
}

/**
 * iOS PWA garde souvent l'ancien bundle Workbox après deploy — Safari charge le réseau.
 * Si le SHA build change : purge caches SW + reload une fois.
 */
export default function PwaStaleBundleGuard() {
  useEffect(() => {
    if (!isPwaStandalone()) return;

    const deployedSha = readDeployedGitSha();
    if (!deployedSha) return;

    let storedSha: string | null = null;
    try {
      storedSha = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return;
    }

    if (storedSha === deployedSha) return;

    const reloadOnceKey = `${STORAGE_KEY}:reload:${deployedSha}`;
    try {
      if (window.sessionStorage.getItem(reloadOnceKey) === "1") {
        window.localStorage.setItem(STORAGE_KEY, deployedSha);
        return;
      }
      window.sessionStorage.setItem(reloadOnceKey, "1");
    } catch {
      /* private mode */
    }

    void (async () => {
      try {
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((reg) => reg.unregister()));
        }
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }
      } catch {
        /* best-effort */
      } finally {
        window.location.reload();
      }
    })();
  }, []);

  return null;
}
