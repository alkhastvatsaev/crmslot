"use client";

import { useCallback, useEffect } from "react";
import { auth } from "@/core/config/firebase";
import type { CompanyMembershipRow } from "@/features/company";

export function useCompanyWorkspaceClaims({
  firebaseUid,
  memberships,
  resolvedClaimsCompanyId,
  claimsInitialSyncDone,
  setClaimsInitialSyncDone,
}: {
  firebaseUid: string | null;
  memberships: CompanyMembershipRow[];
  resolvedClaimsCompanyId: string;
  claimsInitialSyncDone: boolean;
  setClaimsInitialSyncDone: (done: boolean) => void;
}) {
  const refreshClaimsSilent = useCallback(async (): Promise<boolean> => {
    const companyId = resolvedClaimsCompanyId;
    if (!auth?.currentUser || memberships.length === 0 || !companyId) return false;
    try {
      const idToken = await auth.currentUser.getIdToken(false);
      const res = await fetch("/api/company/sync-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ activeCompanyId: companyId }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || !data.ok) return false;
      await auth.currentUser.getIdToken(true);
      return true;
    } catch {
      return false;
    }
  }, [memberships.length, resolvedClaimsCompanyId]);

  useEffect(() => {
    if (!firebaseUid || memberships.length === 0) return;

    if (!resolvedClaimsCompanyId) {
      setClaimsInitialSyncDone(true);
      return;
    }

    if (!claimsInitialSyncDone) {
      const failSafe = setTimeout(() => setClaimsInitialSyncDone(true), 2500);
      void refreshClaimsSilent().finally(() => {
        clearTimeout(failSafe);
        setClaimsInitialSyncDone(true);
      });
      return () => clearTimeout(failSafe);
    }

    const t = setTimeout(() => {
      void refreshClaimsSilent();
    }, 400);
    return () => clearTimeout(t);
  }, [
    firebaseUid,
    memberships.length,
    resolvedClaimsCompanyId,
    refreshClaimsSilent,
    claimsInitialSyncDone,
    setClaimsInitialSyncDone,
  ]);

  return { refreshClaimsSilent };
}
