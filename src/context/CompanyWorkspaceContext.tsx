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
import { recoverMainAuthFromClientPortalLeak } from "@/features/auth/recoverMainAuthFromClientPortalLeak";
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
    return onAuthStateChanged(auth, (u) => {
      setFirebaseUid((prev) => {
        const next = u?.uid ?? null;
        if (prev !== next) setClaimsInitialSyncDone(false);
        return next;
      });
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!auth || authLoading || !membershipsReady || memberships.length > 0) return;
    const user = auth.currentUser;
    if (!user || user.isAnonymous) return;
    void recoverMainAuthFromClientPortalLeak(auth, user);
  }, [authLoading, membershipsReady, memberships.length]);

  useEffect(() => {
    if (!firestore || !firebaseUid || !isConfigured) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMemberships([]);
      setActiveCompanyIdState("");
      setMembershipsReady(true);
      return () => {};
    }

    let unsub: (() => void) | undefined;
    const timeout = setTimeout(() => {
      const membershipsCol = collection(firestore!, "users", firebaseUid, "company_memberships");
      unsub = onSnapshot(
        membershipsCol,
        (snap) => {
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
            let next = "";
            if (stored && rows.some((r) => r.companyId === stored)) next = stored;
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
          setMemberships([]);
          setMembershipsReady(true);
        }
      );
    }, 10);

    return () => {
      clearTimeout(timeout);
      unsub?.();
    };
  }, [firebaseUid]);

  const claimsGatePending = memberships.length > 0 && !claimsInitialSyncDone;

  const effectiveActiveCompanyId = useMemo(() => {
    if (authLoading || !membershipsReady || claimsGatePending) {
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY)?.trim();
        if (stored && !claimsGatePending) return stored;
      }
      return "";
    }
    return activeCompanyId;
  }, [authLoading, membershipsReady, activeCompanyId, claimsGatePending]);

  const refreshClaimsSilent = useCallback(async (): Promise<boolean> => {
    if (!auth?.currentUser || memberships.length === 0 || !activeCompanyId) return false;
    try {
      const idToken = await auth.currentUser.getIdToken(false);
      const res = await fetch("/api/company/sync-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ activeCompanyId }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || !data.ok) return false;
      await auth.currentUser.getIdToken(true);
      return true;
    } catch {
      return false;
    }
  }, [activeCompanyId, memberships.length]);

  useEffect(() => {
    if (!firebaseUid || memberships.length === 0 || !activeCompanyId) return;
    if (!claimsInitialSyncDone) {
      void refreshClaimsSilent().finally(() => setClaimsInitialSyncDone(true));
      return;
    }
    const t = setTimeout(() => {
      void refreshClaimsSilent();
    }, 400);
    return () => clearTimeout(t);
  }, [
    firebaseUid,
    memberships.length,
    activeCompanyId,
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
      workspaceReady: !authLoading && membershipsReady && !claimsGatePending,
      isTenantUser: !authLoading && membershipsReady && memberships.length > 0,
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
      claimsGatePending,
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
