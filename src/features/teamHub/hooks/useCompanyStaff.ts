"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadCompanyStaffCached,
  readCompanyStaffCache,
  upsertCompanyStaffCacheMember,
} from "@/features/teamHub/companyStaffCache";
import type { CompanyStaffMember } from "@/features/teamHub/types";

export function useCompanyStaff(companyId: string | null) {
  const cachedStaff = companyId ? readCompanyStaffCache(companyId) : null;
  const [staff, setStaff] = useState<CompanyStaffMember[]>(cachedStaff ?? []);
  const [loading, setLoading] = useState(Boolean(companyId) && cachedStaff === null);
  const [error, setError] = useState<string | null>(null);
  const fetchGenerationRef = useRef(0);
  const staffRef = useRef(staff);
  staffRef.current = staff;

  const refresh = useCallback(
    async (options?: { force?: boolean }): Promise<CompanyStaffMember[] | null> => {
      if (!companyId) {
        setStaff([]);
        setLoading(false);
        setError(null);
        return null;
      }

      const generation = ++fetchGenerationRef.current;
      const showLoading = staffRef.current.length === 0;
      if (showLoading) setLoading(true);
      setError(null);
      try {
        const { staff: nextStaff } = await loadCompanyStaffCached(companyId, {
          force: options?.force ?? true,
        });
        if (generation !== fetchGenerationRef.current) return null;
        setStaff(nextStaff);
        return nextStaff;
      } catch (e) {
        if (generation !== fetchGenerationRef.current) return null;
        if (showLoading) setStaff([]);
        setError(e instanceof Error ? e.message : "Impossible de charger l'équipe.");
        return null;
      } finally {
        if (generation === fetchGenerationRef.current) {
          setLoading(false);
        }
      }
    },
    [companyId]
  );

  const upsertStaffMember = useCallback(
    (member: CompanyStaffMember) => {
      if (companyId) upsertCompanyStaffCacheMember(companyId, member);
      setStaff((prev) => {
        const next = [...prev.filter((row) => row.uid !== member.uid), member];
        return next.sort((a, b) => a.displayName.localeCompare(b.displayName, "fr"));
      });
    },
    [companyId]
  );

  useEffect(() => {
    void refresh({ force: false });
  }, [refresh]);

  return { staff, loading, error, refresh, upsertStaffMember };
}
