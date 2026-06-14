"use client";

import { useCallback, useState } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";

export function useGmailCreateIntervention(companyId: string | null) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFromMessage = useCallback(
    async (messageId: string) => {
      if (!companyId) throw new Error("Société active requise.");
      setCreating(true);
      setError(null);
      try {
        const res = await fetchWithAuth(
          `/api/integrations/gmail/messages/${encodeURIComponent(messageId)}/create-intervention`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ companyId, autoAssign: true }),
          }
        );
        const data = (await res.json()) as {
          ok?: boolean;
          interventionId?: string;
          autoAssigned?: boolean;
          technicianName?: string;
          error?: string;
        };
        if (!res.ok || !data.ok) {
          throw new Error(data.error ?? "Création impossible.");
        }
        return data;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Création impossible.";
        setError(msg);
        throw e;
      } finally {
        setCreating(false);
      }
    },
    [companyId]
  );

  return { creating, error, createFromMessage };
}
