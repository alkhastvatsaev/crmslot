"use client";

import { cn } from "@/lib/utils";
import type { SubscriptionBillingInterval } from "@/features/subscriptions/subscriptionPlans";

type Props = {
  value: SubscriptionBillingInterval;
  onChange: (value: SubscriptionBillingInterval) => void;
  monthlyLabel: string;
  yearlyLabel: string;
  ariaLabel: string;
};

/** Mensuel / Annuel — libellés complets sans troncature. */
export default function PricingBillingToggle({
  value,
  onChange,
  monthlyLabel,
  yearlyLabel,
  ariaLabel,
}: Props) {
  const options: { id: SubscriptionBillingInterval; label: string; testId: string }[] = [
    { id: "monthly", label: monthlyLabel, testId: "pricing-billing-monthly" },
    { id: "yearly", label: yearlyLabel, testId: "pricing-billing-yearly" },
  ];

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      data-testid="pricing-billing-toggle"
      className="inline-flex shrink-0 gap-1 rounded-2xl bg-slate-100/90 p-1 ring-1 ring-inset ring-slate-200/70"
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-testid={opt.testId}
            onClick={() => onChange(opt.id)}
            className={cn(
              "whitespace-nowrap rounded-xl px-4 py-2 text-[13px] font-semibold leading-none transition",
              active
                ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200/80"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
