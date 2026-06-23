"use client";

import { useEffect } from "react";
import { collection, doc } from "firebase/firestore";
import { firestore } from "@/core/config/firebase";

export function useSmartFormDraftPregenerateId(
  pregeneratedDocId: string,
  setPregeneratedDocId: (id: string) => void
) {
  useEffect(() => {
    if (firestore && !pregeneratedDocId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPregeneratedDocId(doc(collection(firestore, "interventions")).id);
    }
  }, [pregeneratedDocId, setPregeneratedDocId]);
}
