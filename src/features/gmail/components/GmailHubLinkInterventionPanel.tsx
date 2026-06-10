"use client";

import { useEffect, useMemo, useState } from "react";
import { Link2, Loader2 } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { cn } from "@/lib/utils";
import { interventionClientLabel } from "@/features/interventions/technicianSchedule";
import type { GmailLinkCandidate } from "@/features/gmail/useGmailHubLinkIntervention";
import { gmailDivider, gmailEyebrow, gmailFieldClass } from "@/features/gmail/gmailHubUi";
import { HubButton } from "@/core/ui/hub";
import type { Intervention } from "@/features/interventions/types";

type Props = {
  open: boolean;
  messageId: string;
  companyId: string | null;
  candidates: GmailLinkCandidate[];
  loadingSuggestions: boolean;
  linking: boolean;
  suggestionsError: string | null;
  interventions: Intervention[];
  onLoadSuggestions: (messageId: string) => void;
  onLink: (interventionId: string, note?: string) => void;
};

export default function GmailHubLinkInterventionPanel({
  open,
  messageId,
  companyId,
  candidates,
  loadingSuggestions,
  linking,
  suggestionsError,
  interventions,
  onLoadSuggestions,
  onLink,
}: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open || !messageId) return;
    setQuery("");
    setSelectedId(null);
    setNote("");
    onLoadSuggestions(messageId);
  }, [open, messageId, onLoadSuggestions]);

  const filteredLocal = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return interventions
      .filter((iv) => {
        const hay = [interventionClientLabel(iv), iv.address, iv.clientEmail, iv.id, iv.title]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 8);
  }, [interventions, query]);

  const showCandidates = candidates.length > 0;
  const showLocal = query.trim().length >= 2 && filteredLocal.length > 0;

  if (!open) return null;

  return (
    <div
      className={`shrink-0 border-b ${gmailDivider} bg-black/[0.02] px-4 py-3`}
      data-testid="gmail-hub-link-panel"
    >
      <p className={`${gmailEyebrow} mb-2 flex items-center gap-1.5`}>
        <Link2 className="h-3.5 w-3.5" strokeWidth={1.5} />
        {t("gmail.hub.link_to_case")}
      </p>

      {!companyId ? (
        <p className="text-[12px] text-amber-800" data-testid="gmail-hub-link-no-company">
          {t("gmail.hub.link_no_company")}
        </p>
      ) : (
        <>
          <input
            type="search"
            data-testid="gmail-hub-link-search"
            className={`${gmailFieldClass} mb-2`}
            placeholder={String(t("gmail.hub.link_search_placeholder"))}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {loadingSuggestions ? (
            <p className="flex items-center gap-2 text-[12px] text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t("gmail.hub.link_loading")}
            </p>
          ) : null}

          {suggestionsError === "company_missing" ? (
            <p className="text-[12px] text-amber-800">{t("gmail.hub.link_no_company")}</p>
          ) : suggestionsError ? (
            <p className="text-[12px] text-red-700">{suggestionsError}</p>
          ) : null}

          {showCandidates ? (
            <ul
              className="mb-2 max-h-[140px] space-y-1 overflow-y-auto custom-scrollbar"
              data-testid="gmail-hub-link-candidates"
            >
              {candidates.map((c) => (
                <li key={c.interventionId}>
                  <button
                    type="button"
                    data-testid={`gmail-hub-link-candidate-${c.interventionId}`}
                    onClick={() => setSelectedId(c.interventionId)}
                    className={`w-full rounded-xl px-3 py-2 text-left text-[12px] transition-colors ${
                      selectedId === c.interventionId
                        ? "bg-slate-900 text-white"
                        : "bg-white/70 text-slate-800 hover:bg-white"
                    }`}
                  >
                    <span className="font-medium">{c.clientName}</span>
                    {c.status ? <span className="ml-2 opacity-70">{c.status}</span> : null}
                    {c.reasons[0] ? (
                      <span className="mt-0.5 block text-[10px] opacity-75">{c.reasons[0]}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : !loadingSuggestions && !suggestionsError && query.trim().length < 2 ? (
            <p className="mb-2 text-[11px] text-slate-500">{t("gmail.hub.link_no_candidates")}</p>
          ) : null}

          {showLocal ? (
            <ul
              className="mb-2 max-h-[120px] space-y-1 overflow-y-auto custom-scrollbar"
              data-testid="gmail-hub-link-local"
            >
              {filteredLocal.map((iv) => (
                <li key={iv.id}>
                  <button
                    type="button"
                    data-testid={`gmail-hub-link-local-${iv.id}`}
                    onClick={() => setSelectedId(iv.id)}
                    className={`w-full rounded-xl px-3 py-2 text-left text-[12px] transition-colors ${
                      selectedId === iv.id
                        ? "bg-slate-900 text-white"
                        : "bg-white/60 text-slate-800 hover:bg-white/80"
                    }`}
                  >
                    {interventionClientLabel(iv) || iv.id}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <label className="mb-2 block">
            <span className={cn("mb-1 block", gmailEyebrow)}>
              {t("gmail.hub.link_note_optional")}
            </span>
            <input
              type="text"
              data-testid="gmail-hub-link-note"
              className={gmailFieldClass}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
            />
          </label>

          <HubButton
            type="button"
            data-testid="gmail-hub-link-submit"
            fullWidth
            disabled={!selectedId || linking}
            onClick={() => selectedId && onLink(selectedId, note.trim() || undefined)}
          >
            {linking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4" strokeWidth={1.5} />
            )}
            {t("gmail.hub.link_confirm")}
          </HubButton>
        </>
      )}
    </div>
  );
}
