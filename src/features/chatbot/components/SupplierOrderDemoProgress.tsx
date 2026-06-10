"use client";

import { cn } from "@/lib/utils";
import {
  DEMO_SUPPLIER_ORDER_STEPS,
  resolveDemoSupplierOrderProgress,
} from "@/features/chatbot/supplierOrderDemoProgress";
import type { SupplierOrderStatus } from "@/features/suppliers/types";
import { useTranslation } from "@/core/i18n/I18nContext";

type Props = {
  orderId: string;
  status: SupplierOrderStatus | string;
  createdAt?: unknown;
  sentAt?: unknown;
  deliveredAt?: unknown;
};

/** Barre + étapes — avance sur 2 jours depuis la date de commande. */
export default function SupplierOrderDemoProgress({
  orderId,
  status,
  createdAt,
  sentAt,
  deliveredAt,
}: Props) {
  const { t } = useTranslation();
  const { activeIndex, cancelled } = resolveDemoSupplierOrderProgress({
    status,
    createdAt,
    sentAt,
    deliveredAt,
  });

  if (cancelled) {
    return (
      <div
        className="mt-2.5"
        data-testid={`chatbot-supplier-order-demo-progress-${orderId}`}
        aria-label={String(t("chatbot.demo_order_cancelled"))}
      >
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
          {t("chatbot.demo_order_cancelled")}
        </span>
      </div>
    );
  }

  return (
    <div
      className="mt-2 pr-1"
      data-testid={`chatbot-supplier-order-demo-progress-${orderId}`}
      aria-label={String(t("chatbot.demo_order_progress_aria"))}
    >
      <div className="flex items-center gap-0" role="list">
        {DEMO_SUPPLIER_ORDER_STEPS.map((step, idx) => {
          const done = idx < activeIndex;
          const active = idx === activeIndex;
          const last = idx === DEMO_SUPPLIER_ORDER_STEPS.length - 1;
          return (
            <div
              key={step.key}
              role="listitem"
              className="flex min-w-0 flex-1 flex-col items-center gap-0.5"
            >
              <div className="flex w-full items-center">
                <div
                  className={cn(
                    "h-[2px] flex-1",
                    idx === 0 ? "invisible" : done || active ? "bg-slate-400" : "bg-slate-200"
                  )}
                />
                <div
                  className={cn(
                    "shrink-0 rounded-full transition-all",
                    active
                      ? "h-2.5 w-2.5 bg-slate-800 ring-2 ring-slate-200"
                      : done
                        ? "h-2 w-2 bg-slate-400"
                        : "h-2 w-2 bg-slate-200"
                  )}
                  aria-current={active ? "step" : undefined}
                />
                <div
                  className={cn(
                    "h-[2px] flex-1",
                    last ? "invisible" : done ? "bg-slate-400" : "bg-slate-200"
                  )}
                />
              </div>
              <span
                className={cn(
                  "truncate text-center text-[9px] leading-tight",
                  active
                    ? "font-semibold text-slate-700"
                    : done
                      ? "text-slate-400"
                      : "text-slate-300"
                )}
              >
                {t(`chatbot.demo_step_${step.key}`)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
