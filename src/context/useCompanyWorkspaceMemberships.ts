"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { firestore, isConfigured } from "@/core/config/firebase";
import type { CompanyMembershipRow } from "@/features/company/types";
import { ACTIVE_COMPANY_STORAGE_KEY } from "@/context/companyWorkspaceContextTypes";

export function useCompanyWorkspaceMemberships(
  firebaseUid: string | null,
  initialActiveCompanyId?: string
) {
  const [memberships, setMemberships] = useState<CompanyMembershipRow[]>([]);
  const [activeCompanyId, setActiveCompanyIdState] = useState(initialActiveCompanyId ?? "");
  const [membershipsReady, setMembershipsReady] = useState(!isConfigured || !firestore);

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

  return {
    memberships,
    activeCompanyId,
    setActiveCompanyId,
    membershipsReady,
    storedActiveCompanyId,
    resolvedClaimsCompanyId,
  };
}
