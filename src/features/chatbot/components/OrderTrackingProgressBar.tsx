"use client";

import { cn } from "@/lib/utils";

type Props = {
  orderId: string;
  percent: number;
  cancelled?: boolean;
  testIdPrefix?: string;
};

/** Barre fine de suivi — variante minimaliste pour tuiles grille. */
export default function OrderTrackingProgressBar({
  orderId,
  percent,
  cancelled = false,
  testIdPrefix = "chatbot-order",
}: Props) {
  const clamped = Math.max(0, Math.min(100, percent));

  if (cancelled) {
    return (
      <span
        data-testid={`${testIdPrefix}-progress-${orderId}`}
        className="mt-1 block h-1 w-full rounded-full bg-red-200/90"
        aria-hidden
      />
    );
  }

  return (
    <span
      data-testid={`${testIdPrefix}-progress-${orderId}`}
      className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-blue-100/70"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span
        data-testid={`${testIdPrefix}-progress-bar-${orderId}`}
        className={cn(
          "block h-full rounded-full transition-[width]",
          clamped >= 100 ? "bg-blue-600" : "bg-blue-400"
        )}
        style={{ width: `${clamped}%` }}
      />
    </span>
  );
}
