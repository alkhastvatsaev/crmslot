"use client";

import { Inbox, Loader2, Search } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { cn } from "@/lib/utils";
import GmailHubAvatar from "@/features/gmail/components/GmailHubAvatar";
import {
  formatMailDateShort,
  gmailDivider,
  gmailEyebrow,
  gmailFieldClass,
  gmailHubFont,
  gmailShell,
  parseSenderName,
} from "@/features/gmail/gmailHubUi";
import type { GmailHubMessageSummary } from "@/features/gmail/gmailHubTypes";

type Props = {
  activeLabelKey: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
  messages: GmailHubMessageSummary[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  onSelectMessage: (msg: GmailHubMessageSummary) => void;
};

function InboxSkeleton() {
  return (
    <ul className="space-y-0 px-2 py-2" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <li key={i} className="flex gap-3 px-2 py-3">
          <div className="gmail-hub-shimmer h-9 w-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="gmail-hub-shimmer h-3 w-2/5 rounded-md" />
            <div className="gmail-hub-shimmer h-2.5 w-4/5 rounded-md" />
            <div className="gmail-hub-shimmer h-2 w-full rounded-md" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function GmailHubInboxList({
  activeLabelKey,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  messages,
  selectedId,
  loading,
  error,
  onSelectMessage,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className={gmailShell} data-testid="gmail-hub-panel-center" style={gmailHubFont}>
      <header className={`shrink-0 border-b ${gmailDivider} px-4 pb-3 pt-3`}>
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="truncate text-[15px] font-medium tracking-tight text-slate-900">
            {activeLabelKey}
          </h2>
          {!loading && messages.length > 0 ? (
            <span
              className="shrink-0 rounded-full bg-black/[0.04] px-2 py-0.5 text-[11px] tabular-nums text-slate-500"
              data-testid="gmail-hub-message-count"
            >
              {messages.length}
            </span>
          ) : null}
        </div>
        <div className="relative mt-3">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            strokeWidth={1.5}
          />
          <input
            data-testid="gmail-hub-search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearchSubmit();
            }}
            placeholder={String(t("gmail.hub.search_placeholder"))}
            className={`${gmailFieldClass} pl-9`}
          />
        </div>
      </header>

      {error ? (
        <p
          data-testid="gmail-hub-error"
          className="mx-4 mt-2 rounded-xl bg-red-500/[0.07] px-3 py-2 text-[12px] text-red-800"
        >
          {error}
        </p>
      ) : null}

      <ul
        className="min-h-0 flex-1 overflow-y-auto custom-scrollbar"
        data-testid="gmail-hub-message-list"
      >
        {loading && messages.length === 0 ? (
          <InboxSkeleton />
        ) : messages.length === 0 ? (
          <li className="flex flex-col items-center px-6 py-20 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-black/[0.04] text-slate-400">
              <Inbox className="h-6 w-6" strokeWidth={1.25} />
            </span>
            <p className="text-[13px] font-medium text-slate-600">{t("gmail.hub.empty")}</p>
            <p className="mt-1 max-w-[220px] text-[12px] leading-relaxed text-slate-400">
              {t("gmail.hub.empty_hint")}
            </p>
          </li>
        ) : (
          messages.map((msg) => {
            const selected = selectedId === msg.id;
            return (
              <li key={msg.id}>
                <button
                  type="button"
                  data-testid={`gmail-hub-row-${msg.id}`}
                  onClick={() => onSelectMessage(msg)}
                  className={cn(
                    "flex w-full gap-3 px-3 py-3 text-left transition-colors",
                    selected ? "gmail-hub-row-selected" : "hover:bg-black/[0.02]",
                  )}
                >
                  <GmailHubAvatar seed={msg.from} />
                  <span className="min-w-0 flex-1 border-b border-black/[0.04] pb-3">
                    <span className="flex items-baseline justify-between gap-2">
                      <span
                        className={cn(
                          "truncate text-[13px]",
                          msg.isUnread ? "font-semibold text-slate-900" : "text-slate-700",
                        )}
                      >
                        {parseSenderName(msg.from)}
                      </span>
                      <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
                        {formatMailDateShort(msg.date)}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 block truncate text-[12px] leading-snug",
                        msg.isUnread ? "font-medium text-slate-800" : "text-slate-600",
                      )}
                    >
                      {msg.subject || `(${t("gmail.hub.no_subject")})`}
                    </span>
                    <span className="mt-1 block truncate text-[11px] leading-snug text-slate-400">
                      {msg.snippet}
                    </span>
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>

      {loading && messages.length > 0 ? (
        <div className="flex shrink-0 justify-center border-t border-black/[0.05] py-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
        </div>
      ) : null}
    </div>
  );
}
