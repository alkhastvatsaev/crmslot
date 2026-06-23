"use client";

import { useMemo } from "react";
import type { CompanyWorkspaceApi } from "@/context/companyWorkspaceContextTypes";
import { useCompanyWorkspaceAuth } from "@/context/useCompanyWorkspaceAuth";
import { useCompanyWorkspaceMemberships } from "@/context/useCompanyWorkspaceMemberships";
import { useCompanyWorkspaceJoin } from "@/context/useCompanyWorkspaceJoin";
import { useCompanyWorkspaceClaims } from "@/context/useCompanyWorkspaceClaims";

export function useCompanyWorkspaceState(initialActiveCompanyId?: string): CompanyWorkspaceApi {
  const { firebaseUid, authLoading, claimsInitialSyncDone, setClaimsInitialSyncDone } =
    useCompanyWorkspaceAuth();

  const {
    memberships,
    activeCompanyId,
    setActiveCompanyId,
    membershipsReady,
    storedActiveCompanyId,
    resolvedClaimsCompanyId,
  } = useCompanyWorkspaceMemberships(firebaseUid, initialActiveCompanyId);

  const { membershipJoinPending, membershipJoinError, retryDefaultCompanyJoin } =
    useCompanyWorkspaceJoin({
      authLoading,
      membershipsReady,
      membershipsLength: memberships.length,
      firebaseUid,
    });

  const { refreshClaimsSilent } = useCompanyWorkspaceClaims({
    firebaseUid,
    memberships,
    resolvedClaimsCompanyId,
    claimsInitialSyncDone,
    setClaimsInitialSyncDone,
  });

  const joinBlocksWorkspace = false;

  const effectiveActiveCompanyId = useMemo(() => {
    if (authLoading) {
      return "";
    }
    if (!membershipsReady) {
      return storedActiveCompanyId || activeCompanyId.trim();
    }
    const resolved = resolvedClaimsCompanyId || activeCompanyId;
    return resolved;
  }, [
    authLoading,
    membershipsReady,
    activeCompanyId,
    resolvedClaimsCompanyId,
    storedActiveCompanyId,
  ]);

  const workspaceBootstrapReady = membershipsReady || Boolean(storedActiveCompanyId && firebaseUid);

  const activeRole = useMemo(() => {
    return memberships.find((m) => m.companyId === effectiveActiveCompanyId)?.role ?? null;
  }, [memberships, effectiveActiveCompanyId]);

  return useMemo(
    (): CompanyWorkspaceApi => ({
      firebaseUid,
      memberships,
      activeCompanyId: effectiveActiveCompanyId,
      setActiveCompanyId,
      activeRole,
      workspaceReady: !authLoading && workspaceBootstrapReady && !joinBlocksWorkspace,
      isTenantUser: !authLoading && membershipsReady && memberships.length > 0,
      membershipJoinPending,
      membershipJoinError,
      retryDefaultCompanyJoin,
      refreshClaimsSilent,
    }),
    [
      firebaseUid,
      memberships,
      effectiveActiveCompanyId,
      setActiveCompanyId,
      activeRole,
      refreshClaimsSilent,
      authLoading,
      membershipsReady,
      workspaceBootstrapReady,
      joinBlocksWorkspace,
      membershipJoinPending,
      membershipJoinError,
      retryDefaultCompanyJoin,
    ]
  );
}
