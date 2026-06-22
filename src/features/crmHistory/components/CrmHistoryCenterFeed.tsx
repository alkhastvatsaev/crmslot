"use client";

import { Inbox, Loader2 } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { CrmActivityEvent } from "@/features/crmHistory/crmActivityTypes";
import CrmHistoryEventCard from "@/features/crmHistory/components/CrmHistoryEventCard";
import CrmHistoryEventDetailInline from "@/features/crmHistory/components/CrmHistoryEventDetailInline";

type Props = {
  events: CrmActivityEvent[];
  loading: boolean;
  refreshing?: boolean;
  live?: boolean;
  newEventIds?: Set<string>;
  feedError?: string | null;
  selectedEventId?: string | null;
  onEventSelect?: (event: CrmActivityEvent) => void;
  selectedEvent?: CrmActivityEvent | null;
  onClearSelection?: () => void;
  onOpenIntervention?: (event: CrmActivityEvent) => void;
};

const CRM_FEED_ANIMATION_STYLES = `
  @keyframes crmSlideIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .crm-animate-item { animation: crmSlideIn 0.3s cubic-bezier(0.16,1,0.3,1) both; }
`;

export default function CrmHistoryCenterFeed({
  events,
  loading,
  refreshing = false,
  feedError,
  selectedEventId,
  onEventSelect,
  selectedEvent,
  onClearSelection,
  onOpenIntervention,
  newEventIds,
}: Props) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          data-testid="crm-center-loading"
          className="flex flex-1 items-center justify-center gap-2 text-slate-400"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-[13px]">{t("crmHistory.loading")}</span>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          data-testid="crm-center-empty"
          className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400"
        >
          <Inbox className="h-10 w-10 opacity-30" />
          <span className="text-[14px]">{t("crmHistory.empty")}</span>
        </div>
      </div>
    );
  }

  if (selectedEvent) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden" data-testid="crm-center-feed">
        <CrmHistoryEventDetailInline
          event={selectedEvent}
          onBack={() => onClearSelection?.()}
          onOpenIntervention={onOpenIntervention}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" data-testid="crm-center-feed">
      <style>{CRM_FEED_ANIMATION_STYLES}</style>
      {refreshing && (
        <div className="shrink-0 flex items-center justify-center gap-1.5 py-1 text-[11px] text-slate-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          Mise à jour…
        </div>
      )}
      {feedError ? (
        <p
          className="shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900"
          data-testid="crm-feed-error"
          role="status"
        >
          {feedError}
        </p>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto gap-5 p-4">
        <div className="grid grid-cols-3 gap-2">
          {events.map((e, i) => (
            <CrmHistoryEventCard
              key={e.id}
              event={e}
              onSelect={onEventSelect}
              isNew={newEventIds?.has(e.id)}
              isSelected={selectedEventId === e.id}
              index={i}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
