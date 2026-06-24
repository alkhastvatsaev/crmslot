"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { auth } from "@/core/config/firebase";
import { requestDefaultCompanyMembership } from "@/features/auth";
import { readClientPortalDefaultCompanyIdFromEnv } from "@/features/company/clientPortalCompanyId";

export function useCompanyWorkspaceJoin({
  authLoading,
  membershipsReady,
  membershipsLength,
  membershipCompanyIds,
  firebaseUid,
}: {
  authLoading: boolean;
  membershipsReady: boolean;
  membershipsLength: number;
  membershipCompanyIds: string[];
  firebaseUid: string | null;
}) {
  const envDefaultCompanyId = useMemo(() => readClientPortalDefaultCompanyIdFromEnv(), []);
  const missingEnvMembership = Boolean(
    envDefaultCompanyId &&
    membershipsReady &&
    membershipsLength > 0 &&
    !membershipCompanyIds.includes(envDefaultCompanyId)
  );
  const missingAnyMembership = membershipsReady && membershipsLength === 0;
  const shouldJoinDefault = missingAnyMembership || missingEnvMembership;
  const [membershipJoinPending, setMembershipJoinPending] = useState(false);
  const [membershipJoinError, setMembershipJoinError] = useState<string | null>(null);

  const retryDefaultCompanyJoin = useCallback(async () => {
    const user = auth?.currentUser;
    if (!user || user.isAnonymous) return;
    setMembershipJoinPending(true);
    setMembershipJoinError(null);
    try {
      const result = await requestDefaultCompanyMembership(user, { staffKind: "admin" });
      if (!result.ok) {
        setMembershipJoinError(result.error);
      }
    } catch {
      setMembershipJoinError("Impossible de rattacher le compte à la société.");
    } finally {
      setMembershipJoinPending(false);
    }
  }, []);

  useEffect(() => {
    if (!auth || authLoading || !membershipsReady || !shouldJoinDefault) return;
    const user = auth.currentUser;
    if (!user || user.isAnonymous) return;

    let cancelled = false;
    setMembershipJoinPending(true);
    setMembershipJoinError(null);

    const joinTimeout = setTimeout(() => {
      if (!cancelled) {
        setMembershipJoinPending(false);
        setMembershipJoinError("Le rattachement société a expiré. Réessayez.");
      }
    }, 12_000);

    void (async () => {
      try {
        const result = await requestDefaultCompanyMembership(user, { staffKind: "admin" });
        if (cancelled) return;
        if (!result.ok) {
          setMembershipJoinError(result.error);
        }
      } catch {
        if (!cancelled) {
          setMembershipJoinError("Impossible de rattacher le compte à la société.");
        }
      } finally {
        clearTimeout(joinTimeout);
        if (!cancelled) {
          setMembershipJoinPending(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(joinTimeout);
      setMembershipJoinPending(false);
    };
  }, [authLoading, membershipsReady, shouldJoinDefault, firebaseUid]);

  useEffect(() => {
    if (membershipsLength > 0 && membershipJoinPending) {
      setMembershipJoinPending(false);
    }
  }, [membershipsLength, membershipJoinPending]);

  return { membershipJoinPending, membershipJoinError, retryDefaultCompanyJoin };
}
