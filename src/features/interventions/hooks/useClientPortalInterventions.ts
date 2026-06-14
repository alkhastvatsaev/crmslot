"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { clientPortalAuth, firestore, isConfigured } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import type { RequesterProfile } from "@/features/interventions/context/RequesterHubContext";
import type { PortalAccessSessionCase } from "@/features/interventions/portalAccessSession";
import {
  canResolveClientPortalIdentity,
  filterInterventionsForClientPortal,
  resolveClientPortalIdentity,
} from "@/features/interventions/requesterPortalClientScope";

type UseClientPortalInterventionsOptions = {
  profile: Pick<
    RequesterProfile,
    "type" | "firstName" | "lastName" | "phone" | "email" | "companyName"
  >;
  portalAccessCases?: PortalAccessSessionCase[];
};

export function useClientPortalInterventions<T extends { id: string; createdAt?: string | null }>(
  options: UseClientPortalInterventionsOptions
) {
  const { profile, portalAccessCases = [] } = options;
  const canSubscribe = Boolean(isConfigured && clientPortalAuth && firestore);
  const [authUser, setAuthUser] = useState<User | null>(clientPortalAuth?.currentUser ?? null);
  const [rawInterventions, setRawInterventions] = useState<T[]>([]);
  const [loading, setLoading] = useState(canSubscribe);

  const identity = useMemo(
    () => resolveClientPortalIdentity(authUser, profile),
    [authUser, profile]
  );

  const canLoadFirestoreCases = canResolveClientPortalIdentity(identity);

  useEffect(() => {
    if (!clientPortalAuth) return;
    return onAuthStateChanged(clientPortalAuth, setAuthUser);
  }, []);

  useEffect(() => {
    if (!canSubscribe || !canLoadFirestoreCases || !identity.uid) {
      setRawInterventions([]);
      setLoading(false);
      return;
    }

    const db = firestore!;
    const q = query(collection(db, "interventions"), where("createdByUid", "==", identity.uid));

    const unsubSnap = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
        rows.sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        setRawInterventions(rows);
        setLoading(false);
      },
      (error) => {
        logger.warn("[useClientPortalInterventions] listener error", { error: error.message });
        setLoading(false);
      }
    );

    return () => {
      unsubSnap();
    };
  }, [canSubscribe, canLoadFirestoreCases, identity.uid]);

  const firestoreInterventions = useMemo(
    () => filterInterventionsForClientPortal(rawInterventions, identity),
    [rawInterventions, identity]
  );

  const interventions = useMemo(() => {
    const byId = new Map<string, T>();
    for (const row of portalAccessCases as T[]) {
      byId.set(row.id, row);
    }
    for (const row of firestoreInterventions) {
      byId.set(row.id, row);
    }
    return Array.from(byId.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }, [portalAccessCases, firestoreInterventions]);

  return {
    interventions,
    loading: canLoadFirestoreCases && canSubscribe ? loading : false,
    identity,
    requiresLogin: identity.requiresLogin,
    canLoadCases: canLoadFirestoreCases || portalAccessCases.length > 0,
  };
}
