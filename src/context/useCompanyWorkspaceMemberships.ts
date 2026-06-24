"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { firestore, isConfigured } from "@/core/config/firebase";
import type { CompanyMembershipRow, CompanyRole } from "@/features/company";
import {
  mergeCompanyMembershipRows,
  pickActiveCompanyId,
  type CompanyLiveState,
  type MembershipDocSnapshot,
} from "@/features/company/resolveCompanyMembershipRows";
import { ACTIVE_COMPANY_STORAGE_KEY } from "@/context/companyWorkspaceContextTypes";

function parseMembershipRole(role: unknown): CompanyRole {
  return role === "admin" ? "admin" : "collaborateur";
}

function parseMembershipDocs(
  docs: { id: string; data: () => Record<string, unknown> }[]
): MembershipDocSnapshot[] {
  return docs.map((d) => {
    const data = d.data();
    const fallbackName =
      typeof data.companyName === "string" && data.companyName.trim()
        ? data.companyName.trim()
        : "Sans nom";
    return {
      companyId: d.id,
      role: parseMembershipRole(data.role),
      fallbackName,
    };
  });
}

function readCompanyName(data: Record<string, unknown> | undefined): string {
  const name = typeof data?.name === "string" ? data.name.trim() : "";
  return name || "Sans nom";
}

export function useCompanyWorkspaceMemberships(
  firebaseUid: string | null,
  initialActiveCompanyId?: string
) {
  const [membershipDocs, setMembershipDocs] = useState<MembershipDocSnapshot[]>([]);
  const [companyById, setCompanyById] = useState<Map<string, CompanyLiveState>>(new Map());
  const [activeCompanyId, setActiveCompanyIdState] = useState(initialActiveCompanyId ?? "");
  const [membershipsReady, setMembershipsReady] = useState(!isConfigured || !firestore);
  const companyUnsubsRef = useRef<Map<string, () => void>>(new Map());

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

  const memberships = useMemo(
    () => mergeCompanyMembershipRows(membershipDocs, companyById),
    [membershipDocs, companyById]
  );

  useEffect(() => {
    if (!firestore || !firebaseUid || !isConfigured) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMembershipDocs([]);
      setCompanyById(new Map());
      setActiveCompanyIdState("");
      setMembershipsReady(true);
      for (const unsub of companyUnsubsRef.current.values()) unsub();
      companyUnsubsRef.current.clear();
      return () => {};
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMembershipsReady(false);
    setMembershipDocs([]);
    setCompanyById(new Map());

    let unsubMemberships: (() => void) | undefined;
    const bootstrapTimeout = setTimeout(() => {
      setMembershipsReady(true);
    }, 8000);

    const timeout = setTimeout(() => {
      const membershipsCol = collection(firestore!, "users", firebaseUid, "company_memberships");
      unsubMemberships = onSnapshot(
        membershipsCol,
        (snap) => {
          clearTimeout(bootstrapTimeout);
          const parsed = parseMembershipDocs(snap.docs);
          setMembershipDocs(parsed);

          const nextIds = new Set(parsed.map((row) => row.companyId));
          for (const [companyId, unsub] of companyUnsubsRef.current.entries()) {
            if (!nextIds.has(companyId)) {
              unsub();
              companyUnsubsRef.current.delete(companyId);
            }
          }

          setCompanyById((prev) => {
            const next = new Map(prev);
            for (const companyId of nextIds) {
              if (!next.has(companyId)) next.set(companyId, "pending");
            }
            for (const companyId of [...next.keys()]) {
              if (!nextIds.has(companyId)) next.delete(companyId);
            }
            return next;
          });

          for (const companyId of nextIds) {
            if (companyUnsubsRef.current.has(companyId)) continue;
            const companyRef = doc(firestore!, "companies", companyId);
            const unsubCompany = onSnapshot(
              companyRef,
              (companySnap) => {
                setCompanyById((prev) => {
                  const next = new Map(prev);
                  if (!companySnap.exists()) {
                    next.set(companyId, "missing");
                  } else {
                    next.set(companyId, { name: readCompanyName(companySnap.data()) });
                  }
                  return next;
                });
              },
              () => {
                setCompanyById((prev) => {
                  const next = new Map(prev);
                  next.set(companyId, "missing");
                  return next;
                });
              }
            );
            companyUnsubsRef.current.set(companyId, unsubCompany);
          }

          setMembershipsReady(true);
        },
        () => {
          clearTimeout(bootstrapTimeout);
          setMembershipDocs([]);
          setCompanyById(new Map());
          setMembershipsReady(true);
        }
      );
    }, 10);

    return () => {
      clearTimeout(bootstrapTimeout);
      clearTimeout(timeout);
      unsubMemberships?.();
      for (const unsub of companyUnsubsRef.current.values()) unsub();
      companyUnsubsRef.current.clear();
    };
  }, [firebaseUid]);

  useEffect(() => {
    if (!membershipsReady) return;

    const stored =
      typeof window !== "undefined"
        ? (window.localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY)?.trim() ?? "")
        : "";

    setActiveCompanyIdState((prev) => {
      const next =
        memberships.length === 0
          ? stored || prev.trim()
          : pickActiveCompanyId(memberships, prev, stored);
      if (typeof window !== "undefined") {
        if (next) window.localStorage.setItem(ACTIVE_COMPANY_STORAGE_KEY, next);
        else window.localStorage.removeItem(ACTIVE_COMPANY_STORAGE_KEY);
      }
      return next;
    });
  }, [memberships, membershipsReady]);

  const storedActiveCompanyId = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY)?.trim() ?? "";
  }, [membershipsReady, activeCompanyId, memberships.length]);

  const resolvedClaimsCompanyId = useMemo(() => {
    const fromState = activeCompanyId.trim();
    if (fromState && memberships.some((m) => m.companyId === fromState)) return fromState;
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
