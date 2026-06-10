"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, firestore, isConfigured } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import type { Intervention } from "@/features/interventions/types";

export type PortalInterventionRow = Pick<
  Intervention,
  | "id"
  | "status"
  | "invoicePdfUrl"
  | "billingLines"
  | "invoiceAmountCents"
  | "createdAt"
  | "problem"
  | "title"
  | "paymentStatus"
  | "stripePaymentLinkUrl"
>;

/** Dossiers créés par l'utilisateur connecté (portail demandeur). */
export function useRequesterPortalInterventions(profileLastName = "") {
  const canSubscribe = Boolean(isConfigured && auth && firestore);
  const [interventions, setInterventions] = useState<PortalInterventionRow[]>([]);
  const [loading, setLoading] = useState(canSubscribe);

  useEffect(() => {
    if (!canSubscribe) return;

    let unsubSnap: (() => void) | undefined;
    const firebaseAuth = auth!;

    const unsubAuth = onAuthStateChanged(firebaseAuth, (user) => {
      if (unsubSnap) {
        unsubSnap();
        unsubSnap = undefined;
      }
      const db = firestore;
      if (!db || !user) {
        setInterventions([]);
        setLoading(false);
        return;
      }

      const q = query(collection(db, "interventions"), where("createdByUid", "==", user.uid));
      unsubSnap = onSnapshot(
        q,
        (snap) => {
          let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PortalInterventionRow);
          const search = profileLastName.trim();
          if (search.length > 0) {
            const s = search.toLowerCase();
            rows = rows.filter((row) => {
              const data = row as PortalInterventionRow & {
                clientLastName?: string;
                clientFirstName?: string;
                clientCompanyName?: string;
              };
              const last = (data.clientLastName || "").toLowerCase();
              const first = (data.clientFirstName || "").toLowerCase();
              const co = (data.clientCompanyName || "").toLowerCase();
              return last.includes(s) || first.includes(s) || co.includes(s);
            });
          }
          rows.sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          setInterventions(rows);
          setLoading(false);
        },
        (error) => {
          logger.warn("[useRequesterPortalInterventions] listener error", {
            error: error.message,
          });
          setLoading(false);
        }
      );
    });

    return () => {
      if (unsubSnap) unsubSnap();
      unsubAuth();
    };
  }, [canSubscribe, profileLastName]);

  return { interventions, loading };
}
