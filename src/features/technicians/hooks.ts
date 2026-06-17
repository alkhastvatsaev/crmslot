"use client";

import { useState, useEffect, useMemo } from "react";
import { logger } from "@/core/logger";
import { firestore, auth, isConfigured } from "@/core/config/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { Technician } from "./types";
import { withTechnicianAuthUid } from "@/features/technicians/withTechnicianAuthUid";

function isAssignableTechnician(tech: Technician, companyId: string | null): boolean {
  if (tech.active === false) return false;
  const techCompanyId = (tech.companyId ?? "").trim();
  if (companyId && techCompanyId && techCompanyId !== companyId) return false;
  return true;
}

export function useTechnicians() {
  const workspace = useCompanyWorkspaceOptional();
  const companyId = (workspace?.activeCompanyId ?? "").trim() || null;
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured || !firestore || !auth) {
      setTechnicians([]);
      setLoading(false);
      return;
    }

    let unsubscribeAuth: (() => void) | undefined;
    let unsubscribeSnapshot: (() => void) | undefined;
    let active = true;

    const setupAuth = async () => {
      try {
        const { onAuthStateChanged } = await import("firebase/auth");
        if (!active) return;

        unsubscribeAuth = onAuthStateChanged(auth!, (user) => {
          if (!active) return;

          if (user) {
            const techRef = collection(firestore!, "technicians");

            if (unsubscribeSnapshot) unsubscribeSnapshot();

            unsubscribeSnapshot = onSnapshot(
              techRef,
              (snapshot) => {
                if (!active) return;

                const parsed = snapshot.docs
                  .map((d) => withTechnicianAuthUid({ ...d.data(), id: d.id } as Technician))
                  .filter((tech) => isAssignableTechnician(tech, companyId));
                setTechnicians(parsed);
                setLoading(false);
              },
              (error) => {
                logger.error("Erreur lecture techniciens Firestore:", {
                  error: error instanceof Error ? error.message : String(error),
                });
                if (active) {
                  setTechnicians([]);
                  setLoading(false);
                }
              }
            );
          } else {
            if (active) {
              setTechnicians([]);
              setLoading(false);
              if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
                unsubscribeSnapshot = undefined;
              }
            }
          }
        });
      } catch (error) {
        logger.error("Erreur initialisation Auth:", {
          error: error instanceof Error ? error.message : String(error),
        });
        if (active) {
          setTechnicians([]);
          setLoading(false);
        }
      }
    };

    setupAuth();

    return () => {
      active = false;
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [companyId]);

  return useMemo(() => ({ technicians, loading }), [technicians, loading]);
}
