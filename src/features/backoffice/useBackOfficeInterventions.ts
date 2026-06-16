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

function filterInterventionsByCompanyIds(
  companyIds: readonly string[],
  rows: Intervention[]
): Intervention[] {
  if (companyIds.length === 0) return [];
  if (companyIds.length === 1) return filterInterventionsByCompany(companyIds[0]!, rows);
  const allowed = new Set(companyIds);
  return rows.filter((row) => allowed.has((row.companyId ?? "").trim()));
}

export function useBackOfficeInterventions(companyId: BackOfficeInterventionsCompanyScope) {
  const cidList = useMemo(() => normalizeCompanyIds(companyId), [companyId]);
  const cidKey = cidList.join("|");

  const isDemoCompany =
    devUiPreviewEnabled && cidList.length === 1 && cidList[0] === DEMO_COMPANY_ID;
  const noFirestore = !isConfigured || !firestore;

  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loadedCidKey, setLoadedCidKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (noFirestore || cidList.length === 0) return () => {};

    const onlyDemoTenant = cidList.length === 1 && isDemoTenantCompanyId(cidList[0]!);
    if (onlyDemoTenant) {
      setInterventions([]);
      setLoadedCidKey(cidKey);
      setError(null);
      return () => {};
    }

    const q =
      cidList.length === 1
        ? query(collection(firestore!, "interventions"), where("companyId", "==", cidList[0]!))
        : query(
            collection(firestore!, "interventions"),
            where("companyId", "in", cidList.slice(0, 10))
          );

    let unsub: (() => void) | undefined;
    const timeout = setTimeout(() => {
      unsub = onSnapshot(
        q,
        (snap) => {
          const raw = stripKnownSyntheticInterventions(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Intervention)
          );
          setInterventions(filterInterventionsByCompanyIds(cidList, raw));
          setLoadedCidKey(cidKey);
          setError(null);
        },
        (e) => {
          logger.error("Back-office interventions snapshot:", {
            error: e instanceof Error ? e.message : String(e),
          });
          setError(e.message || "Erreur Firestore");
          setLoadedCidKey(cidKey);
        }
      );
    }, 10);

    return () => {
      clearTimeout(timeout);
      if (unsub) unsub();
    };
  }, [cidKey, cidList, noFirestore]);

  const firebaseUid = auth?.currentUser?.uid ?? null;

  const displayInterventions = useMemo(() => {
    if (!isDemoCompany || interventions.length > 0) return interventions;
    return demoInterventionsForCompany(cidList[0] ?? DEMO_COMPANY_ID);
  }, [interventions, isDemoCompany, cidList]);

  if (cidList.length === 0 || noFirestore) {
    return { interventions: displayInterventions, loading: false, error: null, firebaseUid };
  }

  const loading = loadedCidKey !== cidKey;
  return { interventions: displayInterventions, loading, error, firebaseUid };
}
