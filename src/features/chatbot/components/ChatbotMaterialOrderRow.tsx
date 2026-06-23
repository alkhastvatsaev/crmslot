"use client";

import { cn } from "@/lib/utils";
import { formatWhenShort } from "@/features/chatbot/chatbotOrderListFormat";
import type { MaterialOrderDoc } from "@/features/materials/materialOrderFirestore";
import { capitalizeName } from "@/utils/stringUtils";
import { useTranslation } from "@/core/i18n/I18nContext";

export default function ChatbotMaterialOrderRow({
  order,
  orderTitle,
  clientLabel,
  highlighted,
  onViewPdf,
}: {
  order: MaterialOrderDoc;
  orderTitle: string;
  clientLabel: string;
  highlighted: boolean;
  onViewPdf?: () => void;
}) {
  const { t } = useTranslation();
  const date = formatWhenShort(order.createdAt);
  const title =
    orderTitle.trim() ||
    order.partsRequested[0]?.description?.trim() ||
    String(t("chatbot.order_untitled"));

  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p
          className="min-w-0 flex-1 line-clamp-2 text-[13px] font-semibold leading-snug text-slate-900"
          data-testid="chatbot-order-title"
        >
          {title}
        </p>
        {date ? <span className="shrink-0 text-[11px] text-slate-400">{date}</span> : null}
      </div>
      <p
        className="mt-1 truncate text-[11px] text-slate-500"
        data-testid="chatbot-order-client-label"
      >
        {capitalizeName(clientLabel)}
      </p>
    </>
  );

  return (
    <article
      data-testid={`chatbot-material-order-${order.id}`}
      className={cn(
        "border-b border-slate-100 last:border-b-0 transition-colors",
        highlighted ? "bg-slate-50" : onViewPdf ? "hover:bg-slate-50/60" : "opacity-70"
      )}
    >
      {onViewPdf ? (
        <button
          type="button"
          className="w-full px-4 py-3 text-left"
          onClick={onViewPdf}
          data-testid={`chatbot-material-order-pdf-${order.id}`}
          aria-label={String(t("chatbot.view_material_order_pdf"))}
        >
          {inner}
        </button>
      ) : (
        <div className="px-4 py-3">{inner}</div>
      )}
    </article>
  );
}
