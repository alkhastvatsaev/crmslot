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
}

export default function ClientRatingPanel({
  interventionId,
  existingRating,
  existingComment,
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
        className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center"
      >
        <div className="flex justify-center gap-1 mb-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={cn(
                "w-4 h-4",
                s <= selected ? "fill-amber-400 text-amber-400" : "text-slate-200"
              )}
            />
          ))}
        </div>
        <p className="text-[13px] font-semibold text-emerald-700">
          {String(t("rating.thank_you"))}
        </p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (selected === 0) return;
    setLoading(true);
    try {
      await submitClientRating(interventionId, selected, comment);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

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
        onClick={handleSubmit}
        className="w-full rounded-xl bg-black py-2 text-[13px] font-bold text-white disabled:opacity-40 transition-opacity"
      >
        {loading ? "…" : String(t("rating.submit"))}
      </button>
    </div>
  );
}
