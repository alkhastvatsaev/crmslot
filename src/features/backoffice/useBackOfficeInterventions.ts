"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, firestore, isConfigured } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { isDemoTenantCompanyId } from "@/core/config/demoTenantFirestore";
import {
  DEMO_COMPANY_ID,
  devUiPreviewEnabled,
  stripKnownSyntheticInterventions,
} from "@/core/config/devUiPreview";
import { demoInterventionsForCompany } from "@/features/dev/demoInterventions";
import type { Intervention } from "@/features/interventions/types";
import { filterInterventionsByCompany } from "@/features/backoffice/filterInterventionsByCompany";

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

export function useBackOfficeInterventions(companyId: BackOfficeInterventionsCompanyScope) {
  const cidKey = companyScopeKey(companyId);
  const cidList = useMemo(() => (cidKey ? cidKey.split("|") : []), [cidKey]);

  const isDemoCompany =
    devUiPreviewEnabled && cidList.length === 1 && cidList[0] === DEMO_COMPANY_ID;
  const noFirestore = !isConfigured || !firestore;

  const [rowsByCompany, setRowsByCompany] = useState<Record<string, Intervention[]>>({});
  const [loadedCompanyKeys, setLoadedCompanyKeys] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (noFirestore || cidList.length === 0) return () => {};

    const onlyDemoTenant = cidList.length === 1 && isDemoTenantCompanyId(cidList[0]!);
    if (onlyDemoTenant) {
      setRowsByCompany({});
      setLoadedCompanyKeys(cidKey);
      setError(null);
      return () => {};
    }

    setRowsByCompany({});
    setLoadedCompanyKeys("");
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
            setRowsByCompany((prev) => ({
              ...prev,
              [cid]: filterInterventionsByCompany(cid, raw),
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
  }, [cidKey, cidList, noFirestore]);

  const interventions = useMemo(
    () => filterInterventionsByCompanyIds(cidList, mergeInterventionRows(rowsByCompany)),
    [cidList, rowsByCompany]
  );

  const firebaseUid = auth?.currentUser?.uid ?? null;

  const displayInterventions = useMemo(() => {
    if (!isDemoCompany || interventions.length > 0) return interventions;
    return demoInterventionsForCompany(cidList[0] ?? DEMO_COMPANY_ID);
  }, [interventions, isDemoCompany, cidList]);

  if (cidList.length === 0 || noFirestore) {
    return { interventions: displayInterventions, loading: false, error: null, firebaseUid };
  }

  const loading = loadedCompanyKeys !== cidKey;
  return { interventions: displayInterventions, loading, error, firebaseUid };
}
