"use client";

import { useCallback, useState } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import type { CompanyStaffMember, CompanyStaffUpdateInput } from "@/features/teamHub/types";

export function useCompanyStaffActions(companyId: string | null, onSuccess?: () => void) {
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateMember = useCallback(
    async (uid: string, input: CompanyStaffUpdateInput) => {
      if (!companyId) return false;
      setBusyUid(uid);
      setError(null);
      try {
        const res = await fetchWithAuth(
          `/api/company/staff/${encodeURIComponent(uid)}?companyId=${encodeURIComponent(companyId)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        );
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (!res.ok || !data.ok) {
          throw new Error(data.error?.trim() || "Mise à jour impossible.");
        }
        onSuccess?.();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Mise à jour impossible.");
        return false;
      } finally {
        setBusyUid(null);
      }
    },
    [companyId, onSuccess]
  );

  const setMemberActive = useCallback(
    async (member: CompanyStaffMember, active: boolean) => {
      if (!companyId) return false;
      setBusyUid(member.uid);
      setError(null);
      try {
        const res = await fetchWithAuth(
          `/api/company/staff/${encodeURIComponent(member.uid)}?companyId=${encodeURIComponent(companyId)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active }),
          }
        );
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (!res.ok || !data.ok) {
          throw new Error(data.error?.trim() || "Action impossible.");
        }
        onSuccess?.();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action impossible.");
        return false;
      } finally {
        setBusyUid(null);
      }
    },
    [companyId, onSuccess]
  );

  return { busyUid, error, updateMember, setMemberActive, clearError: () => setError(null) };
}
