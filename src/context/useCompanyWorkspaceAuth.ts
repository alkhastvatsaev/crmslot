"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, isConfigured } from "@/core/config/firebase";

export function useCompanyWorkspaceAuth() {
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(isConfigured && !!auth);
  const [claimsInitialSyncDone, setClaimsInitialSyncDone] = useState(false);

  useEffect(() => {
    if (!auth) return () => {};
    let failSafe: ReturnType<typeof setTimeout> | undefined = setTimeout(() => {
      failSafe = undefined;
      setAuthLoading(false);
    }, 4000);
    return onAuthStateChanged(auth, (u) => {
      if (failSafe) {
        clearTimeout(failSafe);
        failSafe = undefined;
      }
      setFirebaseUid((prev) => {
        const next = u?.uid ?? null;
        if (prev !== next) setClaimsInitialSyncDone(false);
        return next;
      });
      setAuthLoading(false);
    });
  }, []);

  return { firebaseUid, authLoading, claimsInitialSyncDone, setClaimsInitialSyncDone };
}
