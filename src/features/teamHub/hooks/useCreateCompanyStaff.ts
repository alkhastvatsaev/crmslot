"use client";

import { useCallback, useState } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import type {
  CompanyStaffKind,
  CompanyStaffMember,
  CreateCompanyStaffInput,
} from "@/features/teamHub/types";

export type CreateCompanyStaffResponse =
  | {
      ok: true;
      mode: "member";
      uid: string;
      created: boolean;
      alreadyMember: boolean;
      passwordResetLink?: string;
      member?: CompanyStaffMember;
    }
  | { ok: true; mode: "invite"; inviteId: string };

export function useCreateCompanyStaff(
  companyId: string | null,
  onSuccess?: (result: CreateCompanyStaffResponse) => void | Promise<void>
) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<CreateCompanyStaffResponse | null>(null);

  const createMember = useCallback(
    async (input: CreateCompanyStaffInput) => {
      if (!companyId) return null;
      setBusy(true);
      setError(null);
      setLastResult(null);
      try {
        const res = await fetchWithAuth(
          `/api/company/staff?companyId=${encodeURIComponent(companyId)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        );
        const data = (await res.json().catch(() => ({}))) as CreateCompanyStaffResponse & {
          error?: string;
        };
        if (!res.ok || !data.ok) {
          throw new Error(data.error?.trim() || "Ajout impossible.");
        }
        setLastResult(data);
        await Promise.resolve(onSuccess?.(data));
        return data;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ajout impossible.");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [companyId, onSuccess]
  );

  const clearFeedback = useCallback(() => {
    setError(null);
    setLastResult(null);
  }, []);

  return { busy, error, lastResult, createMember, clearFeedback };
}

export const COMPANY_STAFF_KIND_OPTIONS: readonly CompanyStaffKind[] = [
  "dirigeant",
  "dispatcher",
  "technician",
];
