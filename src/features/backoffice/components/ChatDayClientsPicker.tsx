"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { ChatDayMissionRow } from "@/features/backoffice/chatDayMissionRow";
import { capitalizeName } from "@/utils/stringUtils";

type Props = {
  rows: ChatDayMissionRow[];
  selectedThreadId?: string | null;
  onSelectGlobal: () => void;
  onSelectClient: (threadId: string) => void;
  className?: string;
};

export default function ChatDayClientsPicker({
  rows,
  selectedThreadId,
  onSelectGlobal,
  onSelectClient,
  className,
}: Props) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="chat-day-clients-picker"
      className={cn("flex min-h-0 flex-1 flex-col gap-3", className)}
    >
      <button
        type="button"
        data-testid="chat-day-global-btn"
        onClick={onSelectGlobal}
        className="flex mx-4 w-[calc(100%-2rem)] items-center justify-center rounded-[18px] border border-blue-100 bg-blue-50/70 py-4.5 px-4 text-center shadow-sm transition-all hover:bg-blue-100/90 active:scale-[0.99]"
      >
        <span className="truncate text-[14px] font-bold text-blue-900 w-full text-center">
          {t("chat.global_chat_title")}
        </span>
      </button>

      {rows.length > 0 ? (
        <ul data-testid="chat-day-clients-list" className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pb-2 custom-scrollbar">
          {rows.map((row) => {
            const displayName = row.clientName.trim()
              ? capitalizeName(row.clientName)
              : t("chat.anonymous_client");
            const active = selectedThreadId === row.threadId;
            return (
              <li key={row.threadId}>
                <button
                  type="button"
                  data-testid={`chat-day-client-row-${row.threadId}`}
                  onClick={() => onSelectClient(row.threadId)}
                  className={cn(
                    "group flex mx-4 w-[calc(100%-2rem)] items-center justify-center rounded-[18px] border bg-white py-4.5 px-4 text-center shadow-sm transition-all active:scale-[0.99]",
                    active
                      ? "border-blue-300 ring-2 ring-blue-100 bg-blue-50/20"
                      : "border-slate-200/80 hover:border-blue-300 hover:bg-slate-50/50 hover:shadow-md",
                  )}
                >
                  <div className="min-w-0 flex-1 flex flex-col justify-center items-center text-center">
                    <span className="truncate text-[14px] font-bold text-slate-800 group-hover:text-blue-700 w-full text-center">
                      {displayName}
                    </span>
                    {row.address ? (
                      <span className="mt-0.5 truncate text-[11px] text-slate-500 w-full text-center">
                        {row.address.split(",")[0]}
                      </span>
                    ) : (
                      <span className="mt-0.5 truncate text-[11px] text-slate-400 w-full text-center">
                        Aucune adresse spécifiée
                      </span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
