"use client";

import { cn } from "@/lib/utils";
import { formatWhenShort, isOpenSupplierOrder } from "@/features/chatbot/chatbotOrderListFormat";
import SupplierOrderDemoProgress from "@/features/chatbot/components/SupplierOrderDemoProgress";
import type { SupplierOrder } from "@/features/suppliers";
import { capitalizeName } from "@/utils/stringUtils";
import { useTranslation } from "@/core/i18n/I18nContext";

export default function ChatbotSupplierOrderRow({
  order,
  orderTitle,
  clientLabel,
  highlighted,
  onViewPdf,
}: {
  order: SupplierOrder;
  orderTitle: string;
  clientLabel: string;
  highlighted: boolean;
  onViewPdf: () => void;
}) {
  const { t } = useTranslation();
  const date = formatWhenShort(order.createdAt);
  const title =
    orderTitle.trim() ||
    order.lines[0]?.label?.trim() ||
    order.lines[0]?.sku?.trim() ||
    String(t("chatbot.order_untitled"));

  return (
    <article
      data-testid={`chatbot-supplier-order-${order.id}`}
      className={cn(
        "group border-b border-slate-100 last:border-b-0 transition-colors",
        highlighted ? "bg-slate-50" : "hover:bg-slate-50/60"
      )}
    >
      <button
        type="button"
        className="w-full px-4 py-3 text-left"
        onClick={onViewPdf}
        data-testid={`chatbot-supplier-order-pdf-${order.id}`}
        aria-label={String(t("chatbot.view_supplier_order_pdf"))}
      >
        <div className="flex items-start justify-between gap-2">
          <p
            className="min-w-0 flex-1 line-clamp-2 text-[13px] font-semibold leading-snug text-slate-900"
            data-testid="chatbot-order-title"
          >
            {title}
          </p>
          {order.emailPending ? (
            <span
              className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700"
              title="Email non envoyé — reconnectez Gmail"
            >
              Email ⚠
            </span>
          ) : null}
        </div>
        <p
          className="mt-1 truncate text-[11px] text-slate-500"
          data-testid="chatbot-order-client-label"
        >
          {capitalizeName(clientLabel)}
          {date ? ` · ${date}` : ""}
        </p>
        {isOpenSupplierOrder(order) ? (
          <SupplierOrderDemoProgress
            orderId={order.id}
            status={order.status}
            createdAt={order.createdAt}
            sentAt={order.sentAt}
            deliveredAt={order.deliveredAt}
          />
        ) : null}
      </button>
    </article>
  );
}
