"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { firestore, isConfigured } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { stripKnownSyntheticInterventions } from "@/core/config/syntheticInterventions";
import type { Intervention } from "@/features/interventions";
import { collectCompanyTechnicianAssignUids } from "@/features/commissionsHub/commissionsHubInterventionsScope";
import type { Technician } from "@/features/technicians";

const FIRESTORE_IN_MAX = 30;

/**
 * Missions assignées aux techniciens de la société — complète la requête `companyId`
 * (le terrain charge par `assignedTechnicianUid` et peut voir des dossiers sans `companyId`).
 */
export function useCommissionsHubSupplementalInterventions(
  companyId: string | null,
  technicians: Technician[]
) {
  const assignUids = useMemo(() => collectCompanyTechnicianAssignUids(technicians), [technicians]);
  const uidKey = assignUids.join("|");
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loadedKey, setLoadedKey] = useState("");

  useEffect(() => {
    if (!companyId || !isConfigured || !firestore || assignUids.length === 0) {
      setInterventions([]);
      setLoadedKey("");
      return () => {};
    }

    const batches: string[][] = [];
    for (let i = 0; i < assignUids.length; i += FIRESTORE_IN_MAX) {
      batches.push(assignUids.slice(i, i + FIRESTORE_IN_MAX));
    }

    const batchMaps = batches.map(() => new Map<string, Intervention>());
    const batchReady = new Set<number>();

    const publish = () => {
      const merged = new Map<string, Intervention>();
      for (const batchMap of batchMaps) {
        for (const [id, iv] of batchMap) merged.set(id, iv);
      }
      setInterventions(stripKnownSyntheticInterventions([...merged.values()]));
      if (batchReady.size === batches.length) setLoadedKey(uidKey);
    };

    const unsubs = batches.map((batch, batchIdx) => {
      const q = query(
        collection(firestore!, "interventions"),
        where("assignedTechnicianUid", "in", batch)
      );
      return onSnapshot(
        q,
        (snap) => {
          const batchMap = new Map<string, Intervention>();
          for (const d of snap.docs) {
            batchMap.set(d.id, { id: d.id, ...d.data() } as Intervention);
          }
          batchMaps[batchIdx] = batchMap;
          batchReady.add(batchIdx);
          publish();
        },
        (error) => {
          logger.warn("[useCommissionsHubSupplementalInterventions] snapshot error", {
            companyId,
            batchIdx,
            error: error.message,
          });
          batchMaps[batchIdx] = new Map();
          batchReady.add(batchIdx);
          publish();
        }
      );
    });

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, [companyId, uidKey]);

  const loading = Boolean(companyId && assignUids.length > 0 && loadedKey !== uidKey);

  return { supplementalInterventions: interventions, supplementalLoading: loading };
}
