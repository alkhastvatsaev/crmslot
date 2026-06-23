"use client";

import { useEffect } from "react";

export function useSmartFormDraftPrefill(
  setFirstName: (v: string) => void,
  setLastName: (v: string) => void,
  setPhone: (v: string) => void,
  setParentInterventionId: (id: string | null) => void
) {
  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    const raw = sessionStorage.getItem("crmslot_prefill_client");
    if (!raw) return;
    sessionStorage.removeItem("crmslot_prefill_client");
    try {
      const prefill = JSON.parse(raw) as {
        clientName?: string;
        phone?: string;
        clientId?: string;
        parentInterventionId?: string;
      };
      const name = prefill.clientName?.trim() ?? "";
      if (name) {
        const parts = name.split(/\s+/);
        setFirstName(parts[0] ?? "");
        setLastName(parts.slice(1).join(" "));
      }
      if (prefill.phone?.trim()) setPhone(prefill.phone.trim());
      if (prefill.parentInterventionId?.trim()) {
        setParentInterventionId(prefill.parentInterventionId.trim());
      }
      void prefill.clientId;
    } catch {
      /* ignore */
    }
    const savRaw = sessionStorage.getItem("crmslot_prefill_sav");
    if (savRaw) {
      sessionStorage.removeItem("crmslot_prefill_sav");
      setParentInterventionId(savRaw.trim());
    }
  }, [setFirstName, setLastName, setParentInterventionId, setPhone]);
}
