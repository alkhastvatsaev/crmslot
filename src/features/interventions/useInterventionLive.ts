"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { firestore, isConfigured } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import type { Intervention } from "@/features/interventions/types";

/**
 * Snapshot temps réel d’une intervention.
 * Un seul listener par `interventionId` par composant — préférer passer `liveIntervention`
 * depuis un parent commun (ex. `TechnicianHubPage`) pour éviter les doublons.
 */
export function useInterventionLive(
  interventionId: string | null,
  enabled = true
): Intervention | null {
  const [data, setData] = useState<Intervention | null>(null);

  useEffect(() => {
    if (!enabled || !interventionId?.trim() || !isConfigured || !firestore) {
      setData(null);
      return () => {};
    }

    const id = interventionId.trim();
    const ref = doc(firestore, "interventions", id);
    let generation = 0;
    let unsub: (() => void) | undefined;

    const attach = () => {
      generation += 1;
      const gen = generation;
      unsub = onSnapshot(
        ref,
        { includeMetadataChanges: false },
        (snap) => {
          if (gen !== generation) return;
          if (!snap.exists()) {
            setData(null);
            return;
          }
          setData({ id: snap.id, ...snap.data() } as Intervention);
        },
        (error) => {
          if (gen !== generation) return;
          logger.warn("[useInterventionLive] Firestore listener error:", {
            error: error instanceof Error ? error.message : String(error),
          });
          setData(null);
        }
      );
    };

    attach();

    return () => {
      generation += 1;
      const stop = unsub;
      // Décaler le teardown évite la race ca9 (unsub + resub immédiat — Strict Mode / HMR).
      if (typeof queueMicrotask === "function") {
        queueMicrotask(() => stop?.());
      } else {
        setTimeout(() => stop?.(), 0);
      }
    };
  }, [interventionId, enabled]);

  return data;
}

/** Utilise un snapshot parent si fourni, sinon ouvre un listener local. */
export function useInterventionLiveSource(
  caseId: string | null,
  liveIntervention?: Intervention | null
): Intervention | null {
  const fromHook = useInterventionLive(
    liveIntervention !== undefined ? null : caseId,
    liveIntervention === undefined
  );
  return liveIntervention !== undefined ? liveIntervention : fromHook;
}
