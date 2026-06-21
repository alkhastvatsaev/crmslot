"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Intervention, InterventionEvent } from "@/features/interventions/types";
import { statusLabelKey } from "@/features/interventions/technicianSchedule";
import { useTranslation } from "@/core/i18n/I18nContext";

type CentralizedTimelineProps = {
  events: InterventionEvent[];
  onAddComment?: (content: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
};

export function CentralizedTimeline({
  events,
  onAddComment,
  isLoading = false,
  className,
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
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const labelForStatus = (status: string | undefined) => {
    if (!status) return "—";
    return t(statusLabelKey(status as Intervention["status"]));
  };

  return (
    <div
      data-testid="centralized-timeline"
      className={cn("flex min-h-[200px] min-w-0 flex-col", className)}
    >
      <p className="mb-3 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
        {t("timeline.title")}
      </p>

      <div
        data-testid="centralized-timeline-scroll"
        className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto"
      >
        {isLoading ? (
          <p
            data-testid="centralized-timeline-loading"
            className="py-6 text-center text-[13px] text-slate-400"
          >
            {t("common.loading")}
          </p>
        ) : sortedEvents.length === 0 ? (
          <p
            data-testid="centralized-timeline-empty"
            className="py-8 text-center text-[13px] text-slate-500"
          >
            {t("timeline.empty")}
          </p>
        ) : (
          <ol data-testid="centralized-timeline-list" className="relative space-y-4 pl-4">
            <span aria-hidden className="absolute bottom-2 left-[7px] top-2 w-px bg-slate-200/90" />
            {sortedEvents.map((event) => (
              <li
                key={event.id}
                data-testid={`timeline-event-${event.type}-${event.id}`}
                className="relative flex min-w-0 items-start gap-3"
              >
                <TimelineEventIcon type={event.type} />
                <div className="min-w-0 flex-1 rounded-[16px] bg-white/90 px-3 py-2.5 ring-1 ring-inset ring-slate-100">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[12px] font-semibold leading-snug text-slate-800">
                      {t(`timeline.type.${event.type}`)}
                    </span>
                    <span className="text-[10px] tabular-nums text-slate-400">
                      {format(new Date(event.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}
                    </span>
                  </div>

                  {event.type === "status_change" ? (
                    <p className="mt-2 text-[12px] leading-snug text-slate-600">
                      {labelForStatus(event.oldStatus)} → {labelForStatus(event.newStatus)}
                    </p>
                  ) : null}

                  {event.content ? (
                    <p className="mt-2 whitespace-pre-wrap text-[12px] leading-snug text-slate-600">
                      {event.content}
                    </p>
                  ) : null}

                  {event.actorRole ? (
                    <p className="mt-2 text-center text-[10px] font-medium uppercase tracking-wide text-slate-400">
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
          className="mt-4 min-w-0 border-t border-slate-100/90 pt-3"
        >
          <div className="flex min-w-0 flex-col gap-2">
            <input
              type="text"
              data-testid="centralized-timeline-comment-input"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={String(t("timeline.comment_placeholder"))}
              className="min-w-0 w-full rounded-[14px] border-0 bg-white px-3 py-2.5 text-[13px] text-slate-800 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              data-testid="centralized-timeline-comment-submit"
              disabled={!commentText.trim() || isSubmitting}
              className="inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-[14px] bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  {t("timeline.sending")}
                </>
              ) : (
                t("timeline.send")
              )}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function TimelineEventIcon({ type }: { type: InterventionEvent["type"] }) {
  const base =
    "relative z-[1] flex h-4 w-4 shrink-0 items-center justify-center rounded-full ring-2 ring-white";
  switch (type) {
    case "status_change":
      return <span className={cn(base, "bg-sky-500")} aria-hidden />;
    case "comment":
      return <span className={cn(base, "bg-amber-400")} aria-hidden />;
    case "email":
      return <span className={cn(base, "bg-violet-500")} aria-hidden />;
    case "material_order":
      return <span className={cn(base, "bg-emerald-500")} aria-hidden />;
    case "commission":
      return <span className={cn(base, "bg-orange-400")} aria-hidden />;
    case "portal_chat":
      return <span className={cn(base, "bg-indigo-500")} aria-hidden />;
    default:
      return <span className={cn(base, "bg-slate-300")} aria-hidden />;
  }
}
