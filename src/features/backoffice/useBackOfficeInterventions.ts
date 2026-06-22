"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocsFromServer,
  onSnapshot,
  query,
  where,
  type QuerySnapshot,
} from "firebase/firestore";
import { auth, firestore, isConfigured } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { stripKnownSyntheticInterventions } from "@/core/config/syntheticInterventions";
import type { Intervention } from "@/features/interventions/types";
import { filterInterventionsByCompany } from "@/features/backoffice/filterInterventionsByCompany";
import { useDocumentPageVisible } from "@/core/perf/useDocumentPageVisible";
import {
  shouldUseIosFirestorePolling,
  startIosFirestorePoll,
} from "@/core/firestore/iosFirestorePolling";

export type BackOfficeInterventionsCompanyScope = string | readonly string[] | null;

function normalizeCompanyIds(companyId: BackOfficeInterventionsCompanyScope): string[] {
  if (!companyId) return [];
  if (typeof companyId === "string") {
    const trimmed = companyId.trim();
    return trimmed ? [trimmed] : [];
  }
  return [...new Set(companyId.map((c) => c.trim()).filter(Boolean))];
}

function companyScopeKey(companyId: BackOfficeInterventionsCompanyScope): string {
  return normalizeCompanyIds(companyId).join("|");
}

function filterInterventionsByCompanyIds(
  companyIds: readonly string[],
  rows: Intervention[]
): Intervention[] {
  if (companyIds.length === 0) return [];
  if (companyIds.length === 1) return filterInterventionsByCompany(companyIds[0]!, rows);
  const allowed = new Set(companyIds);
  return rows.filter((row) => allowed.has((row.companyId ?? "").trim()));
}

function mergeInterventionRows(byCompany: Record<string, Intervention[]>): Intervention[] {
  const merged = new Map<string, Intervention>();
  for (const rows of Object.values(byCompany)) {
    for (const row of rows) merged.set(row.id, row);
  }
  return [...merged.values()];
}

function parseCompanyInterventions(cid: string, snap: QuerySnapshot): Intervention[] {
  const raw = stripKnownSyntheticInterventions(
    snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Intervention)
  );
  return filterInterventionsByCompany(cid, raw);
}

export function useBackOfficeInterventions(
  companyId: BackOfficeInterventionsCompanyScope,
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled !== false;
  const cidKey = companyScopeKey(companyId);
  const cidList = useMemo(() => (cidKey ? cidKey.split("|") : []), [cidKey]);
  const noFirestore = !isConfigured || !firestore;

  const [rowsByCompany, setRowsByCompany] = useState<Record<string, Intervention[]>>({});
  const [loadedCompanyKeys, setLoadedCompanyKeys] = useState("");
  const [error, setError] = useState<string | null>(null);
  const documentVisible = useDocumentPageVisible();
  const iosPolling = shouldUseIosFirestorePolling();

  useEffect(() => {
    if (noFirestore || cidList.length === 0 || !enabled) return () => {};

    setRowsByCompany({});
    setLoadedCompanyKeys("");
    setError(null);

    if (iosPolling) {
      let cancelled = false;

      const pullAll = async () => {
        if (cancelled || !documentVisible) return;
        const db = firestore!;
        const next: Record<string, Intervention[]> = {};
        try {
          await Promise.all(
            cidList.map(async (cid) => {
              const q = query(collection(db, "interventions"), where("companyId", "==", cid));
              const snap = await getDocsFromServer(q);
              next[cid] = parseCompanyInterventions(cid, snap);
            })
          );
          if (cancelled) return;
          setRowsByCompany(next);
          setLoadedCompanyKeys(cidKey);
          setError(null);
        } catch (e) {
          if (cancelled) return;
          logger.error("Back-office interventions poll (iOS):", {
            companyIds: cidList,
            error: e instanceof Error ? e.message : String(e),
          });
          setError(e instanceof Error ? e.message : "Erreur Firestore");
          setLoadedCompanyKeys(cidKey);
        }
      };

      const stopPoll = startIosFirestorePoll(() => void pullAll(), documentVisible);
      return () => {
        cancelled = true;
        stopPoll();
      };
    }

    const loaded = new Set<string>();
    const unsubs: Array<() => void> = [];
    const timeout = setTimeout(() => {
      for (const cid of cidList) {
        const q = query(collection(firestore!, "interventions"), where("companyId", "==", cid));
        const unsub = onSnapshot(
          q,
          (snap) => {
            setRowsByCompany((prev) => ({
              ...prev,
              [cid]: parseCompanyInterventions(cid, snap),
            }));
            loaded.add(cid);
            if (loaded.size === cidList.length) {
              setLoadedCompanyKeys(cidKey);
            }
            setError(null);
          },
          (e) => {
            logger.error("Back-office interventions snapshot:", {
              companyId: cid,
              error: e instanceof Error ? e.message : String(e),
            });
            setError(e.message || "Erreur Firestore");
            loaded.add(cid);
            if (loaded.size === cidList.length) {
              setLoadedCompanyKeys(cidKey);
            }
          }
        );
        unsubs.push(unsub);
      }
    }, 10);

    return () => {
      clearTimeout(timeout);
      for (const unsub of unsubs) unsub();
    };
  }, [cidKey, cidList, noFirestore, enabled, iosPolling, documentVisible]);

  const interventions = useMemo(
    () => filterInterventionsByCompanyIds(cidList, mergeInterventionRows(rowsByCompany)),
    [cidList, rowsByCompany]
  );

  const firebaseUid = auth?.currentUser?.uid ?? null;
  const loading = cidList.length > 0 && loadedCompanyKeys !== cidKey;

  if (cidList.length === 0 || noFirestore) {
    return { interventions, loading: false, error: null, firebaseUid };
  }

  return { interventions, loading, error, firebaseUid };
}
