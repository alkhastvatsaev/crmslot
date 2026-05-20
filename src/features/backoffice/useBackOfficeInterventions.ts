"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, firestore, isConfigured } from "@/core/config/firebase";
import { stripKnownSyntheticInterventions } from "@/core/config/devUiPreview";
import type { Intervention } from "@/features/interventions/types";
import { filterInterventionsByCompany } from "@/features/backoffice/filterInterventionsByCompany";

export function useBackOfficeInterventions(companyId: string | null) {
  const cidForEffect = (companyId ?? "").trim();

  const noFirestore = !isConfigured || !firestore;

  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loadedCid, setLoadedCid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (noFirestore || !cidForEffect) return () => {};

    const cid = cidForEffect;
    const q = query(collection(firestore!, "interventions"), where("companyId", "==", cid));

    let unsub: (() => void) | undefined;
    const timeout = setTimeout(() => {
      unsub = onSnapshot(
        q,
        (snap) => {
          const raw = stripKnownSyntheticInterventions(
            snap.docs.map((d) => ({ id: d.id, ...d.data() } as Intervention)),
          );
          setInterventions(filterInterventionsByCompany(cid, raw));
          setLoadedCid(cid);
          setError(null);
        },
        (e) => {
          console.error("Back-office interventions snapshot:", e);
          setError(e.message || "Erreur Firestore");
          setLoadedCid(cid);
        },
      );
    }, 10);

    return () => {
      clearTimeout(timeout);
      if (unsub) unsub();
    };
  }, [cidForEffect, noFirestore]);

  const firebaseUid = auth?.currentUser?.uid ?? null;

  if (!cidForEffect || noFirestore) {
    return { interventions, loading: false, error: null, firebaseUid };
  }

  const loading = loadedCid !== cidForEffect;
  return { interventions, loading, error, firebaseUid };
}
