"use client";

import { useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import type { WizardStep } from "@/features/interventions/smartFormTypes";

export function useSmartFormDraftTakenSlots(
  step: WizardStep,
  interventionCompanyId: string | null,
  setTakenSlots: (slots: Record<string, string[]>) => void
) {
  useEffect(() => {
    if (step !== 5) return;
    const fetchSlots = async () => {
      const db = firestore;
      if (!db) return;
      try {
        let q;
        if (interventionCompanyId) {
          q = query(
            collection(db, "interventions"),
            where("companyId", "==", interventionCompanyId),
            where("status", "in", ["pending", "accepted", "in_progress", "resolved"])
          );
        } else {
          return;
        }
        const snap = await getDocs(q);
        const slots: Record<string, string[]> = {};
        snap.forEach((d) => {
          const data = d.data();
          if (data.scheduledDate && data.scheduledTime) {
            if (!slots[data.scheduledDate]) slots[data.scheduledDate] = [];
            slots[data.scheduledDate].push(data.scheduledTime);
          }
        });
        setTakenSlots(slots);
      } catch (err) {
        logger.error("Erreur récupération dispos", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    };
    void fetchSlots();
  }, [interventionCompanyId, setTakenSlots, step]);
}
