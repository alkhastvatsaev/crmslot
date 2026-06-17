"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import type { CompanyStaffMember } from "@/features/teamHub/types";

export function useCompanyStaff(companyId: string | null) {
  const [staff, setStaff] = useState<CompanyStaffMember[]>([]);
  const [loading, setLoading] = useState(Boolean(companyId));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!companyId) {
      setStaff([]);
      setLoading(false);
      setError(null);
      return;
    }

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
      setStaff(data.staff);
    } catch (e) {
      setStaff([]);
      setError(e instanceof Error ? e.message : "Impossible de charger l'équipe.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { staff, loading, error, refresh };
}
