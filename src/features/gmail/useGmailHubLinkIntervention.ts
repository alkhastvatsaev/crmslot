"use client";

import { useCallback, useState } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";

export type GmailLinkCandidate = {
  interventionId: string;
  clientName: string;
  status: string | null;
  score: number;
  reasons: string[];
};

export function useGmailHubLinkIntervention(companyId: string | null) {
  const [candidates, setCandidates] = useState<GmailLinkCandidate[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSuggestions = useCallback(
    async (messageId: string) => {
      if (!companyId) {
        setCandidates([]);
        setError("company_missing");
        return;
      }
      setLoadingSuggestions(true);
      setError(null);
      try {
        const params = new URLSearchParams({ companyId });
        const res = await fetchWithAuth(
          `/api/integrations/gmail/messages/${encodeURIComponent(messageId)}/link-suggestions?${params}`,
        );
        const data = (await res.json()) as {
          candidates?: GmailLinkCandidate[];
          error?: string;
        };
        if (!res.ok) throw new Error(data.error ?? "Suggestions indisponibles.");
        setCandidates(data.candidates ?? []);
      } catch (e) {
        setCandidates([]);
        setError(e instanceof Error ? e.message : "Erreur suggestions.");
      } finally {
        setLoadingSuggestions(false);
      }
    },
    [companyId],
  );

  const linkToIntervention = useCallback(
    async (messageId: string, interventionId: string, note?: string) => {
      if (!companyId) throw new Error("Société active requise.");
      setLinking(true);
      setError(null);
      try {
        const res = await fetchWithAuth(
          `/api/integrations/gmail/messages/${encodeURIComponent(messageId)}/link-intervention`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ companyId, interventionId, note: note?.trim() || undefined }),
          },
        );
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Liaison impossible.");
        return data;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Liaison impossible.";
        setError(msg);
        throw e;
      } finally {
        setLinking(false);
      }
    },
    [companyId],
  );

  const reset = useCallback(() => {
    setCandidates([]);
    setError(null);
  }, []);

  return {
    candidates,
    loadingSuggestions,
    linking,
    error,
    loadSuggestions,
    linkToIntervention,
    reset,
  };
}
