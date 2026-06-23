"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, firestore, isConfigured } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { stripKnownSyntheticInterventions } from "@/core/config/syntheticInterventions";
import type { Intervention } from "@/features/interventions";
import { filterInterventionsByCompany } from "@/features/backoffice/filterInterventionsByCompany";
import {
  readAdminInboxInterventionsCache,
  splitInterventionsByCompanyIds,
  writeAdminInboxInterventionsCache,
} from "@/features/offline/adminInboxInterventionsCache";

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
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    if (cidList.length === 0 || !cidKey) return;
    const cached = readAdminInboxInterventionsCache(cidKey);
    if (cached.length === 0) return;
    const byCompany = splitInterventionsByCompanyIds(cidList, cached);
    setRowsByCompany(byCompany);
    setFromCache(true);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setLoadedCompanyKeys(cidKey);
      setError(null);
    }
  }, [cidKey, cidList]);

  useEffect(() => {
    if (noFirestore || cidList.length === 0 || !enabled) return () => {};
    if (typeof navigator !== "undefined" && !navigator.onLine) return () => {};

    setError(null);

    const loaded = new Set<string>();
    const unsubs: Array<() => void> = [];
    const timeout = setTimeout(() => {
      for (const cid of cidList) {
        const q = query(collection(firestore!, "interventions"), where("companyId", "==", cid));
        const unsub = onSnapshot(
          q,
          (snap) => {
            const raw = stripKnownSyntheticInterventions(
              snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Intervention)
            );
            setRowsByCompany((prev) => {
              const next = {
                ...prev,
                [cid]: filterInterventionsByCompany(cid, raw),
              };
              loaded.add(cid);
              if (loaded.size === cidList.length) {
                setLoadedCompanyKeys(cidKey);
                setFromCache(false);
                writeAdminInboxInterventionsCache(cidKey, mergeInterventionRows(next));
              }
              return next;
            });
            setError(null);
          },
          (e) => {
            logger.error("Back-office interventions snapshot:", {
              companyId: cid,
              error: e instanceof Error ? e.message : String(e),
            });
            setError(e.message || "Erreur Firestore");
            const cached = readAdminInboxInterventionsCache(cidKey);
            if (cached.length > 0) {
              setRowsByCompany(splitInterventionsByCompanyIds(cidList, cached));
              setFromCache(true);
            }
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
  }, [cidKey, cidList, noFirestore, enabled]);

  const interventions = useMemo(
    () => filterInterventionsByCompanyIds(cidList, mergeInterventionRows(rowsByCompany)),
    [cidList, rowsByCompany]
  );

  const firebaseUid = auth?.currentUser?.uid ?? null;
  const loading = cidList.length > 0 && loadedCompanyKeys !== cidKey;

  if (cidList.length === 0 || noFirestore) {
    return { interventions, loading: false, error: null, firebaseUid, fromCache };
  }

  return { interventions, loading, error, firebaseUid, fromCache };
}
