"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useTechnicians } from "@/features/technicians/hooks";
import type { Technician } from "@/features/technicians/types";
import { withTechnicianAuthUid } from "@/features/technicians/withTechnicianAuthUid";

function mergeTechnicianLists(
  firestoreTechnicians: Technician[],
  ensuredTechnicians: Technician[]
): Technician[] {
  const byId = new Map<string, Technician>();
  for (const technician of ensuredTechnicians) {
    byId.set(technician.id, withTechnicianAuthUid(technician));
  }
  for (const technician of firestoreTechnicians) {
    byId.set(technician.id, withTechnicianAuthUid(technician));
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/** Techniciens assignables : profils terrain assurés côté serveur + sync Firestore temps réel. */
export function useAssignableTechnicians() {
  const workspace = useCompanyWorkspaceOptional();
  const companyId =
    workspace?.workspaceReady === true ? workspace.activeCompanyId?.trim() || null : null;
  const { technicians: firestoreTechnicians, loading: firestoreLoading } = useTechnicians();
  const [ensuredTechnicians, setEnsuredTechnicians] = useState<Technician[]>([]);
  const [ensuring, setEnsuring] = useState(Boolean(companyId));
  const [ensureError, setEnsureError] = useState<string | null>(null);
  const ensuredCompanyIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      setEnsuredTechnicians([]);
      setEnsuring(false);
      setEnsureError(null);
      ensuredCompanyIdRef.current = null;
      return;
    }

    let cancelled = false;
    setEnsuring(true);
    setEnsureError(null);

    void (async () => {
      try {
        const res = await fetchWithAuth(
          `/api/company/assignable-technicians?companyId=${encodeURIComponent(companyId)}`
        );
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          technicians?: Technician[];
          error?: string;
        };
        if (!res.ok || !data.ok || !Array.isArray(data.technicians)) {
          throw new Error(
            data.error?.trim() || "Impossible de charger les techniciens assignables."
          );
        }
        if (cancelled) return;
        ensuredCompanyIdRef.current = companyId;
        setEnsuredTechnicians(
          data.technicians.map((technician) => withTechnicianAuthUid(technician))
        );
      } catch (error) {
        if (cancelled) return;
        setEnsureError(
          error instanceof Error
            ? error.message
            : "Impossible de charger les techniciens assignables."
        );
        setEnsuredTechnicians([]);
      } finally {
        if (!cancelled) setEnsuring(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const technicians = useMemo(
    () => mergeTechnicianLists(firestoreTechnicians, ensuredTechnicians),
    [firestoreTechnicians, ensuredTechnicians]
  );

  return {
    technicians,
    loading: firestoreLoading || ensuring,
    ensureError,
  };
}
