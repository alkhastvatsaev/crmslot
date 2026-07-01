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
    hasRealMemberships,
  } = useCompanyWorkspaceMemberships(firebaseUid, initialActiveCompanyId);

  const membershipCompanyIds = useMemo(
    () => memberships.map((m) => m.companyId.trim()).filter(Boolean),
    [memberships]
  );

  const { membershipJoinPending, membershipJoinError, retryDefaultCompanyJoin } =
    useCompanyWorkspaceJoin({
      authLoading,
      membershipsReady,
      membershipsLength: memberships.length,
      membershipCompanyIds,
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
      const bootStored = storedActiveCompanyId.trim();
      return bootStored || activeCompanyId.trim();
    }
    if (memberships.length === 0) {
      return "";
    }
    return resolvedClaimsCompanyId || activeCompanyId.trim();
  }, [
    authLoading,
    membershipsReady,
    memberships.length,
    activeCompanyId,
    resolvedClaimsCompanyId,
    storedActiveCompanyId,
  ]);

  const workspaceBootstrapReady =
    membershipsReady || (!authLoading && Boolean(firebaseUid) && Boolean(storedActiveCompanyId));

  const activeRole = useMemo(() => {
    const byActive = memberships.find((m) => m.companyId === effectiveActiveCompanyId);
    if (byActive) return byActive.role;
    return memberships[0]?.role ?? null;
  }, [memberships, effectiveActiveCompanyId]);

  return useMemo(
    (): CompanyWorkspaceApi => ({
      firebaseUid,
      memberships,
      activeCompanyId: effectiveActiveCompanyId,
      setActiveCompanyId,
      activeRole,
      workspaceReady: !authLoading && workspaceBootstrapReady && !joinBlocksWorkspace,
      isTenantUser: !authLoading && membershipsReady && hasRealMemberships,
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
      hasRealMemberships,
      membershipJoinPending,
      membershipJoinError,
      retryDefaultCompanyJoin,
    ]
  );
}
