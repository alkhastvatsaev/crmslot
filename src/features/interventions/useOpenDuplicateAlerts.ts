"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { firestore, isConfigured } from "@/core/config/firebase";
import {
  isSyntheticInterventionId,
} from "@/core/config/devUiPreview";
import type { DuplicateAlertDoc, DuplicateAlertRow } from "@/features/interventions/duplicateAlertTypes";

/** Flux temps réel des alertes doublons pour une société (filtrage « open » côté client). */
export function useOpenDuplicateAlerts(companyId: string | null) {
  const [rows, setRows] = useState<DuplicateAlertRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cid = (companyId ?? "").trim();

    if (!isConfigured || !firestore) {
      setRows([]);
      setLoading(false);
      return () => {};
    }

    if (!cid) {
      setRows([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    const q = query(collection(firestore, "intervention_duplicate_alerts"), where("companyId", "==", cid));

    let unsub: (() => void) | undefined;
    const timeout = setTimeout(() => {
      unsub = onSnapshot(
        q,
        (snap) => {
          const parsed = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DuplicateAlertDoc) }));
          setRows(
            parsed.filter(
              (r) =>
                !isSyntheticInterventionId(r.similarInterventionId) &&
                !isSyntheticInterventionId(r.newInterventionId),
            ),
          );
          setLoading(false);
        },
        () => {
          setLoading(false);
        },
      );
    }, 10);

    return () => {
      clearTimeout(timeout);
      unsub?.();
    };
  }, [companyId]);

  const openAlerts = useMemo(() => rows.filter((r) => r.status === "open"), [rows]);

  return { openAlerts, loading };
}
