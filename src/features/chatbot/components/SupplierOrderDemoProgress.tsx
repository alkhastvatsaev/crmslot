"use client";

import { cn } from "@/lib/utils";
import {
  DEMO_SUPPLIER_ORDER_STEPS,
  resolveDemoSupplierOrderProgress,
} from "@/features/chatbot/supplierOrderDemoProgress";
import type { SupplierOrderStatus } from "@/features/suppliers/types";

type Props = {
  orderId: string;
  status: SupplierOrderStatus | string;
};

/** Barre + étapes — mode démonstration uniquement. */
export default function SupplierOrderDemoProgress({ orderId, status }: Props) {
  const { activeIndex, cancelled } = resolveDemoSupplierOrderProgress(status);

  if (cancelled) {
    return (
      <div
        className="mt-2.5"
        data-testid={`chatbot-supplier-order-demo-progress-${orderId}`}
        aria-label="Commande annulée"
      >
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
          Commande annulée
        </span>
      </div>
    );
  }

  return (
    <div
      className="mt-2.5 pr-1"
      data-testid={`chatbot-supplier-order-demo-progress-${orderId}`}
      aria-label="Progression commande démo"
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
                    idx === 0 ? "invisible" : done || active ? "bg-blue-400" : "bg-slate-200",
                  )}
                />
                <div
                  className={cn(
                    "shrink-0 rounded-full transition-all",
                    active
                      ? "h-2.5 w-2.5 bg-blue-500 shadow-sm shadow-blue-300 ring-2 ring-blue-200/80"
                      : done
                        ? "h-2 w-2 bg-blue-400"
                        : "h-2 w-2 bg-slate-200",
                  )}
                  aria-current={active ? "step" : undefined}
                />
                <div
                  className={cn(
                    "h-[2px] flex-1",
                    last ? "invisible" : done ? "bg-blue-400" : "bg-slate-200",
                  )}
                />
              </div>
              <span
                className={cn(
                  "truncate text-center text-[9px] leading-tight",
                  active
                    ? "font-semibold text-blue-600"
                    : done
                      ? "text-blue-500"
                      : "text-slate-300",
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
