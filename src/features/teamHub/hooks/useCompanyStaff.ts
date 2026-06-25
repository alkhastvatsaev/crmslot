"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import type { CompanyStaffMember } from "@/features/teamHub/types";

function sortStaff(members: CompanyStaffMember[]): CompanyStaffMember[] {
  return [...members].sort((a, b) => a.displayName.localeCompare(b.displayName, "fr"));
}

export function useCompanyStaff(companyId: string | null) {
  const [staff, setStaff] = useState<CompanyStaffMember[]>([]);
  const [loading, setLoading] = useState(Boolean(companyId));
  const [error, setError] = useState<string | null>(null);
  const fetchGenerationRef = useRef(0);

  const refresh = useCallback(async (): Promise<CompanyStaffMember[] | null> => {
    if (!companyId) {
      setStaff([]);
      setLoading(false);
      setError(null);
      return null;
    }

    const generation = ++fetchGenerationRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(
        `/api/company/staff?companyId=${encodeURIComponent(companyId)}`
      );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        staff?: CompanyStaffMember[];
        error?: string;
      };
      if (!res.ok || !data.ok || !Array.isArray(data.staff)) {
        throw new Error(data.error?.trim() || "Impossible de charger l'équipe.");
      }
      if (generation !== fetchGenerationRef.current) return null;
      const nextStaff = sortStaff(data.staff);
      setStaff(nextStaff);
      return nextStaff;
    } catch (e) {
      if (generation !== fetchGenerationRef.current) return null;
      setStaff([]);
      setError(e instanceof Error ? e.message : "Impossible de charger l'équipe.");
      return null;
    } finally {
      if (generation === fetchGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [companyId]);

  const upsertStaffMember = useCallback((member: CompanyStaffMember) => {
    setStaff((prev) => sortStaff([...prev.filter((row) => row.uid !== member.uid), member]));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { staff, loading, error, refresh, upsertStaffMember };
}
