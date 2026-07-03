"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useTechnicians } from "@/features/technicians/hooks";
import type { Technician } from "@/features/technicians/types";
import { withTechnicianAuthUid } from "@/features/technicians/withTechnicianAuthUid";

function mergeTechnicianRecord(primary: Technician, secondary: Technician): Technician {
  const a = withTechnicianAuthUid(primary);
  const b = withTechnicianAuthUid(secondary);
  return {
    ...a,
    ...b,
    authUid: a.authUid || b.authUid,
    name: b.name?.trim() ? b.name : a.name,
    status: b.status ?? a.status,
    location: b.location ?? a.location,
  };
}

function mergeTechnicianLists(
  firestoreTechnicians: Technician[],
  ensuredTechnicians: Technician[]
): Technician[] {
  const byId = new Map<string, Technician>();
  for (const technician of ensuredTechnicians) {
    const existing = byId.get(technician.id);
    byId.set(
      technician.id,
      existing ? mergeTechnicianRecord(technician, existing) : withTechnicianAuthUid(technician)
    );
  }
  for (const technician of firestoreTechnicians) {
    const existing = byId.get(technician.id);
    byId.set(
      technician.id,
      existing ? mergeTechnicianRecord(existing, technician) : withTechnicianAuthUid(technician)
    );
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

const ensuredTechniciansCache = new Map<string, Technician[]>();

/** Techniciens assignables : profils terrain assurés côté serveur + sync Firestore temps réel. */
export function useAssignableTechnicians() {
  const workspace = useCompanyWorkspaceOptional();
  const companyId =
    workspace?.workspaceReady === true ? workspace.activeCompanyId?.trim() || null : null;
  const { technicians: firestoreTechnicians, loading: firestoreLoading } = useTechnicians();
  const cachedEnsured = companyId ? ensuredTechniciansCache.get(companyId) : undefined;
  const [ensuredTechnicians, setEnsuredTechnicians] = useState<Technician[]>(cachedEnsured ?? []);
  const [ensuring, setEnsuring] = useState(
    Boolean(companyId) && !cachedEnsured && firestoreTechnicians.length === 0
  );
  const [ensureError, setEnsureError] = useState<string | null>(null);
  const ensuredCompanyIdRef = useRef<string | null>(cachedEnsured ? companyId : null);

  useEffect(() => {
    if (!companyId) {
      setEnsuredTechnicians([]);
      setEnsuring(false);
      setEnsureError(null);
      ensuredCompanyIdRef.current = null;
      return;
    }

    const cached = ensuredTechniciansCache.get(companyId);
    if (cached) {
      ensuredCompanyIdRef.current = companyId;
      setEnsuredTechnicians(cached);
      setEnsuring(false);
      setEnsureError(null);
      return;
    }

    let cancelled = false;
    setEnsuredTechnicians([]);
    setEnsuring(firestoreTechnicians.length === 0);
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
        const normalized = data.technicians.map((technician) => withTechnicianAuthUid(technician));
        ensuredTechniciansCache.set(companyId, normalized);
        ensuredCompanyIdRef.current = companyId;
        setEnsuredTechnicians(normalized);
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
  }, [companyId, firestoreTechnicians.length]);

  const technicians = useMemo(
    () => mergeTechnicianLists(firestoreTechnicians, ensuredTechnicians),
    [firestoreTechnicians, ensuredTechnicians]
  );

  return {
    technicians,
    loading: technicians.length === 0 && (firestoreLoading || ensuring),
    ensureError,
    ensuring,
  };
}
