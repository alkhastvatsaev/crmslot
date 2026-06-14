"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitClientRating } from "@/features/interventions/submitClientRating";
import { useTranslation } from "@/core/i18n/I18nContext";

interface Props {
  interventionId: string;
  existingRating?: number | null;
  existingComment?: string | null;
  compact?: boolean;
  premium?: boolean;
  unified?: boolean;
}

export default function ClientRatingPanel({
  interventionId,
  existingRating,
  existingComment,
  compact = false,
  premium = false,
  unified = false,
}: Props) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(existingRating ?? 0);
  const [comment, setComment] = useState(existingComment ?? "");
  const [submitted, setSubmitted] = useState(Boolean(existingRating));
  const [loading, setLoading] = useState(false);

  if (submitted) {
    return (
      <div
        data-testid="client-rating-submitted"
        className={
          compact && premium && unified
            ? "flex flex-col items-center gap-1.5"
            : compact && premium
              ? "flex flex-col items-center gap-1.5 rounded-2xl bg-slate-50/90 px-4 py-3 ring-1 ring-black/[0.04]"
              : compact
                ? "flex items-center justify-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5"
                : "mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center"
        }
      >
        <div
          className={cn(
            "flex justify-center gap-0.5",
            !compact && "mb-1 gap-1",
            premium && "gap-1"
          )}
        >
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={cn(
                premium ? "h-3.5 w-3.5" : compact ? "h-3 w-3" : "h-4 w-4",
                s <= selected
                  ? premium
                    ? "fill-slate-700 text-slate-700"
                    : "fill-amber-400 text-amber-400"
                  : "text-slate-200"
              )}
            />
          ))}
        </div>
        {!compact || premium ? (
          <p
            className={
              premium
                ? "text-[12px] font-normal text-slate-500"
                : "text-[13px] font-semibold text-emerald-700"
            }
          >
            {String(t("rating.thank_you"))}
          </p>
        ) : (
          <span className="text-[10px] font-bold text-emerald-700">
            {String(t("rating.thank_you"))}
          </span>
        )}
      </div>
    );
  }

  const handleSubmit = async (rating = selected) => {
    if (rating === 0) return;
    setLoading(true);
    try {
      await submitClientRating(interventionId, rating, compact ? "" : comment);
      setSelected(rating);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <div
        data-testid="client-rating-panel"
        className={
          premium && unified
            ? "flex w-full flex-col items-center gap-2"
            : premium
              ? "flex w-full flex-col items-center gap-2 rounded-2xl bg-slate-50/90 px-4 py-3 ring-1 ring-black/[0.04]"
              : "flex w-full flex-col items-center gap-1 rounded-xl border border-black/5 bg-slate-50/80 px-2 py-2"
        }
      >
        <p
          className={
            premium && unified
              ? "sr-only"
              : premium
                ? "text-[11px] font-normal text-slate-400"
                : "text-[10px] font-bold uppercase tracking-wide text-slate-500"
          }
        >
          {String(t("rating.title"))}
        </p>
        <div className="flex justify-center gap-1.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              disabled={loading}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => void handleSubmit(s)}
              className="transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              <Star
                className={cn(
                  premium ? "h-5 w-5" : "h-5 w-5",
                  s <= (hovered || selected)
                    ? premium
                      ? "fill-slate-800 text-slate-800"
                      : "fill-amber-400 text-amber-400"
                    : "text-slate-300"
                )}
              />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="client-rating-panel"
      className="mt-4 rounded-xl border border-black/5 bg-slate-50 px-4 py-4"
    >
      <p className="text-[13px] font-bold text-black mb-3 text-center">
        {String(t("rating.title"))}
      </p>
      <div className="flex justify-center gap-2 mb-3">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setSelected(s)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                "w-7 h-7 transition-colors",
                s <= (hovered || selected) ? "fill-amber-400 text-amber-400" : "text-slate-300"
              )}
            />
          </button>
        ))}
      </div>
      {selected > 0 && (
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={String(t("rating.comment_placeholder"))}
          rows={2}
          className="w-full resize-none rounded-xl border border-black/8 bg-white px-3 py-2 text-[13px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black/10 mb-3"
        />
      )}
      <button
        type="button"
        disabled={selected === 0 || loading}
        onClick={() => void handleSubmit()}
        className="w-full rounded-xl bg-black py-2 text-[13px] font-bold text-white disabled:opacity-40 transition-opacity"
      >
        {loading ? "…" : String(t("rating.submit"))}
      </button>
    </div>
  );
}
