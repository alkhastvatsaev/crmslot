"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, firestore, isConfigured } from "@/core/config/firebase";
import { requestDefaultCompanyMembership } from "@/features/auth/requestDefaultCompanyMembership";
import type { CompanyMembershipRow, CompanyRole } from "@/features/company/types";

const ACTIVE_COMPANY_STORAGE_KEY = "crmslot_active_company_id";

export type CompanyWorkspaceApi = {
  firebaseUid: string | null;
  memberships: CompanyMembershipRow[];
  activeCompanyId: string;
  setActiveCompanyId: (id: string) => void;
  activeRole: CompanyRole | null;
  /** Auth + memberships Firestore résolus (évite le fallback chat-only pendant le boot). */
  workspaceReady: boolean;
  /** Au moins une société — interventions filtrées + création avec tenant */
  isTenantUser: boolean;
  /** Rattachement auto à la société unique en cours ou en échec. */
  membershipJoinPending: boolean;
  membershipJoinError: string | null;
  retryDefaultCompanyJoin: () => Promise<void>;
  /** Met à jour bmTenants / bmActive côté token (sans toast). */
  refreshClaimsSilent: () => Promise<boolean>;
};

const CompanyWorkspaceContext = createContext<CompanyWorkspaceApi | null>(null);

export function CompanyWorkspaceProvider({
  children,
  initialActiveCompanyId,
}: {
  children: ReactNode;
  initialActiveCompanyId?: string;
}) {
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<CompanyMembershipRow[]>([]);
  const [activeCompanyId, setActiveCompanyIdState] = useState(initialActiveCompanyId ?? "");
  const [authLoading, setAuthLoading] = useState(isConfigured && !!auth);
  const [membershipsReady, setMembershipsReady] = useState(!isConfigured || !auth);
  const [claimsInitialSyncDone, setClaimsInitialSyncDone] = useState(false);
  const [membershipJoinPending, setMembershipJoinPending] = useState(false);
  const [membershipJoinError, setMembershipJoinError] = useState<string | null>(null);

  const persistActiveId = useCallback((id: string) => {
    if (typeof window !== "undefined") {
      if (id) window.localStorage.setItem(ACTIVE_COMPANY_STORAGE_KEY, id);
      else window.localStorage.removeItem(ACTIVE_COMPANY_STORAGE_KEY);
    }
  }, []);

  const setActiveCompanyId = useCallback(
    (id: string) => {
      setActiveCompanyIdState(id);
      persistActiveId(id);
    },
    [persistActiveId]
  );

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

  useEffect(() => {
    if (!firestore || !firebaseUid || !isConfigured) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMemberships([]);
      setActiveCompanyIdState("");
      setMembershipsReady(true);
      return () => {};
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMembershipsReady(false);
    setMemberships([]);

    let unsub: (() => void) | undefined;
    const bootstrapTimeout = setTimeout(() => {
      setMembershipsReady(true);
    }, 8000);

    const timeout = setTimeout(() => {
      const membershipsCol = collection(firestore!, "users", firebaseUid, "company_memberships");
      unsub = onSnapshot(
        membershipsCol,
        (snap) => {
          clearTimeout(bootstrapTimeout);
          const rows: CompanyMembershipRow[] = snap.docs.map((d) => {
            const data = d.data() as { role?: string; companyName?: string };
            return {
              companyId: d.id,
              companyName: typeof data.companyName === "string" ? data.companyName : "Sans nom",
              role: data.role === "admin" ? "admin" : "collaborateur",
            };
          });
          setMemberships(rows);
          setMembershipsReady(true);

          const stored =
            typeof window !== "undefined"
              ? window.localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY)
              : null;

          setActiveCompanyIdState((prev) => {
            const storedTrimmed = stored?.trim() ?? "";
            if (rows.length === 0) {
              return storedTrimmed || prev.trim();
            }
            let next = "";
            if (storedTrimmed && rows.some((r) => r.companyId === storedTrimmed))
              next = storedTrimmed;
            else if (prev && rows.some((r) => r.companyId === prev)) next = prev;
            else next = rows[0]?.companyId ?? "";
            if (typeof window !== "undefined") {
              if (next) window.localStorage.setItem(ACTIVE_COMPANY_STORAGE_KEY, next);
              else window.localStorage.removeItem(ACTIVE_COMPANY_STORAGE_KEY);
            }
            return next;
          });
        },
        () => {
          clearTimeout(bootstrapTimeout);
          setMemberships([]);
          setMembershipsReady(true);
        }
      );
    }, 10);

    return () => {
      clearTimeout(bootstrapTimeout);
      clearTimeout(timeout);
      unsub?.();
    };
  }, [firebaseUid]);

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

  const storedActiveCompanyId = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY)?.trim() ?? "";
  }, [membershipsReady, activeCompanyId, memberships.length]);

  const resolvedClaimsCompanyId = useMemo(() => {
    const fromState = activeCompanyId.trim();
    if (fromState) return fromState;
    const fromMembership = memberships[0]?.companyId?.trim() ?? "";
    if (fromMembership) return fromMembership;
    return storedActiveCompanyId;
  }, [activeCompanyId, memberships, storedActiveCompanyId]);

  useEffect(() => {
    if (!auth || authLoading || !membershipsReady || memberships.length > 0) return;
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
  }, [authLoading, membershipsReady, memberships.length, firebaseUid]);

  useEffect(() => {
    if (memberships.length > 0 && membershipJoinPending) {
      setMembershipJoinPending(false);
    }
  }, [memberships.length, membershipJoinPending]);

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
  ]);

  const activeRole: CompanyRole | null = useMemo(() => {
    return memberships.find((m) => m.companyId === effectiveActiveCompanyId)?.role ?? null;
  }, [memberships, effectiveActiveCompanyId]);

  const value = useMemo(
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

  return (
    <CompanyWorkspaceContext.Provider value={value}>{children}</CompanyWorkspaceContext.Provider>
  );
}

export function useCompanyWorkspace(): CompanyWorkspaceApi {
  const ctx = useContext(CompanyWorkspaceContext);
  if (!ctx) throw new Error("CompanyWorkspaceProvider manquant.");
  return ctx;
}

export function useCompanyWorkspaceOptional(): CompanyWorkspaceApi | null {
  return useContext(CompanyWorkspaceContext);
}
