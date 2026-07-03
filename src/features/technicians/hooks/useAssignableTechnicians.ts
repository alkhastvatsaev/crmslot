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

const CACHE_TTL_MS = 5 * 60 * 1000;
const ensuredTechniciansCache = new Map<
  string,
  { data: Technician[]; ts: number; firestoreCount: number }
>();

function isCacheValid(companyId: string, firestoreCount: number): Technician[] | undefined {
  const entry = ensuredTechniciansCache.get(companyId);
  if (!entry) return undefined;
  if (Date.now() - entry.ts >= CACHE_TTL_MS) return undefined;
  if (entry.firestoreCount !== firestoreCount) return undefined;
  return entry.data;
}

/** Techniciens assignables : profils terrain assurés côté serveur + sync Firestore temps réel. */
export function useAssignableTechnicians() {
  const workspace = useCompanyWorkspaceOptional();
  const companyId =
    workspace?.workspaceReady === true ? workspace.activeCompanyId?.trim() || null : null;
  const { technicians: firestoreTechnicians, loading: firestoreLoading } = useTechnicians();

  const firestoreCount = firestoreTechnicians.length;

  const [ensuredTechnicians, setEnsuredTechnicians] = useState<Technician[]>(() => {
    if (!companyId) return [];
    return isCacheValid(companyId, firestoreCount) ?? [];
  });
  const [ensuring, setEnsuring] = useState(() => {
    if (!companyId) return false;
    return !isCacheValid(companyId, firestoreCount) && firestoreCount === 0;
  });
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

    const validData = isCacheValid(companyId, firestoreCount);
    if (validData) {
      ensuredCompanyIdRef.current = companyId;
      setEnsuredTechnicians(validData);
      setEnsuring(false);
      setEnsureError(null);
      return;
    }

    let cancelled = false;
    setEnsuredTechnicians([]);
    setEnsuring(firestoreCount === 0);
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
        ensuredTechniciansCache.set(companyId, {
          data: normalized,
          ts: Date.now(),
          firestoreCount,
        });
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
  }, [companyId, firestoreCount]);

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
