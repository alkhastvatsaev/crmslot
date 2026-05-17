"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, firestore, isConfigured } from "@/core/config/firebase";
import {
  DEMO_COMPANY_ID,
  devUiPreviewEnabled,
  realInterventionsOnly,
  stripKnownSyntheticInterventions,
} from "@/core/config/devUiPreview";
import type { Intervention } from "@/features/interventions/types";
import { demoInterventionsForCompany } from "@/features/dev/demoInterventions";
import { filterInterventionsByCompany } from "@/features/backoffice/filterInterventionsByCompany";


export function useBackOfficeInterventions(companyId: string | null) {
  const cidForEffect = (companyId ?? "").trim();

  const noFirestore = !isConfigured || !firestore;

  const [interventions, setInterventions] = useState<Intervention[]>(() =>
    noFirestore && devUiPreviewEnabled && !realInterventionsOnly
      ? demoInterventionsForCompany(cidForEffect || DEMO_COMPANY_ID)
      : [],
  );
  // Tracks which cid produced the current interventions — used to derive loading
  const [loadedCid, setLoadedCid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Société démo : données supplémentaires en mémoire (cas typique Vercel + auth anonyme). */
  const shouldMergeDemo =
    devUiPreviewEnabled &&
    !realInterventionsOnly &&
    cidForEffect === DEMO_COMPANY_ID;

  useEffect(() => {
    if (noFirestore || !cidForEffect) return () => {};

    const cid = cidForEffect;
    const q = query(collection(firestore!, "interventions"), where("companyId", "==", cid));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const raw = stripKnownSyntheticInterventions(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as Intervention)),
        );
        const firestoreInterventions = filterInterventionsByCompany(cid, raw);

        if (shouldMergeDemo) {
          const demoData = demoInterventionsForCompany(cid);
          setInterventions([...firestoreInterventions, ...demoData]);
        } else {
          setInterventions(firestoreInterventions);
        }

        setLoadedCid(cid);
        setError(null);
      },
      (e) => {
        console.error("Back-office interventions snapshot:", e);
        setError(e.message || "Erreur Firestore");
        setLoadedCid(cid);
      },
    );

    return () => unsub();
  }, [cidForEffect, shouldMergeDemo, noFirestore]);

  const firebaseUid = auth?.currentUser?.uid ?? null;

  if (!cidForEffect || noFirestore) {
    return { interventions, loading: false, error: null, firebaseUid };
  }

  const loading = loadedCid !== cidForEffect;
  return { interventions, loading, error, firebaseUid };
}
