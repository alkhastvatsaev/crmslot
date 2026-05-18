"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Intervention, InterventionEvent } from "@/features/interventions/types";
import { statusLabelKey } from "@/features/interventions/technicianSchedule";
import { useTranslation } from "@/core/i18n/I18nContext";

type CentralizedTimelineProps = {
  events: InterventionEvent[];
  onAddComment?: (content: string) => Promise<void>;
  isLoading?: boolean;
};

export function CentralizedTimeline({
  events,
  onAddComment,
  isLoading = false,
}: CentralizedTimelineProps) {
  const { t } = useTranslation();
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting || !onAddComment) return;

    setIsSubmitting(true);
    try {
      await onAddComment(commentText.trim());
      setCommentText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const labelForStatus = (status: string | undefined) => {
    if (!status) return "—";
    return t(statusLabelKey(status as Intervention["status"]));
  };

  return (
    <div
      data-testid="centralized-timeline"
      className="flex h-full min-h-[200px] flex-col rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="rounded-t-xl border-b border-slate-200 bg-slate-50 p-4">
        <h3 className="font-semibold text-slate-800">{t("timeline.title")}</h3>
      </div>

      <div
        data-testid="centralized-timeline-scroll"
        className="flex-1 space-y-6 overflow-y-auto p-4"
      >
        {isLoading ? (
          <p data-testid="centralized-timeline-loading" className="text-center text-slate-400">
            {t("common.loading")}
          </p>
        ) : sortedEvents.length === 0 ? (
          <p data-testid="centralized-timeline-empty" className="py-8 text-center text-slate-500">
            {t("timeline.empty")}
          </p>
        ) : (
          <ol
            data-testid="centralized-timeline-list"
            className="relative ml-4 space-y-6 border-l-2 border-slate-100 pb-4"
          >
            {sortedEvents.map((event) => (
              <li
                key={event.id}
                data-testid={`timeline-event-${event.type}-${event.id}`}
                className="relative -ml-[17px] flex items-start gap-4"
              >
                <TimelineEventIcon type={event.type} />
                <div className="min-w-0 flex-1 rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-slate-700">
                      {t(`timeline.type.${event.type}`)}
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">
                      {format(new Date(event.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}
                    </span>
                  </div>

                  {event.type === "status_change" ? (
                    <p className="text-sm text-slate-600">
                      {labelForStatus(event.oldStatus)} → {labelForStatus(event.newStatus)}
                    </p>
                  ) : null}

                  {event.content ? (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{event.content}</p>
                  ) : null}

                  {event.actorRole ? (
                    <p className="mt-1 text-[11px] text-slate-400">
                      {t(`workflow.owner.${event.actorRole}`)}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {onAddComment ? (
        <form
          data-testid="centralized-timeline-comment-form"
          onSubmit={(e) => void handleSubmit(e)}
          className="rounded-b-xl border-t border-slate-200 bg-slate-50 p-4"
        >
          <div className="flex gap-2">
            <input
              type="text"
              data-testid="centralized-timeline-comment-input"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={String(t("timeline.comment_placeholder"))}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              data-testid="centralized-timeline-comment-submit"
              disabled={!commentText.trim() || isSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? t("timeline.sending") : t("timeline.send")}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function TimelineEventIcon({ type }: { type: InterventionEvent["type"] }) {
  const base =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white text-xs shadow-sm";
  switch (type) {
    case "status_change":
      return (
        <span className={`${base} bg-blue-100 text-blue-600`} aria-hidden>
          ↻
        </span>
      );
    case "comment":
      return (
        <span className={`${base} bg-yellow-100 text-yellow-700`} aria-hidden>
          💬
        </span>
      );
    case "email":
      return (
        <span className={`${base} bg-purple-100 text-purple-700`} aria-hidden>
          ✉
        </span>
      );
    case "material_order":
      return (
        <span className={`${base} bg-green-100 text-green-700`} aria-hidden>
          📦
        </span>
      );
    case "commission":
      return (
        <span className={`${base} bg-amber-100 text-amber-800`} aria-hidden>
          €
        </span>
      );
    default:
      return <span className={`${base} bg-gray-100 text-gray-500`} aria-hidden>•</span>;
  }
}
