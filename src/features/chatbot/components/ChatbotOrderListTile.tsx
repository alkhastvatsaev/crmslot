"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import OrderTrackingProgressBar from "@/features/chatbot/components/OrderTrackingProgressBar";
import type { OrderTrackingProgress } from "@/features/chatbot/chatbotOrderTrackingProgress";
import { cn } from "@/lib/utils";

type Props = {
  orderId: string;
  title: string;
  subtitle: string;
  imageUrl?: string | null;
  tracking?: OrderTrackingProgress | null;
  highlighted?: boolean;
  onClick?: () => void;
  clickable?: boolean;
  testIdPrefix: string;
  ariaLabel?: string;
};

/** Ligne commande — vignette + texte + barre de suivi (rail Matériel). */
export default function ChatbotOrderListTile({
  orderId,
  title,
  subtitle,
  imageUrl,
  tracking,
  highlighted = false,
  onClick,
  clickable = true,
  testIdPrefix,
  ariaLabel,
}: Props) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !failed;

  const className = cn(
    "flex w-full gap-3 rounded-[14px] border border-slate-200/80 bg-white p-2.5 text-left transition",
    highlighted && "border-slate-300 bg-slate-50 ring-1 ring-slate-200/80",
    clickable && "hover:border-slate-300/90 hover:bg-slate-50/80"
  );

  const body = (
    <>
      <span className="flex h-[53px] w-[53px] shrink-0 items-center justify-center rounded-[12px] bg-slate-50/90">
        {showImage ? (
          <img
            data-testid={`${testIdPrefix}-image-${orderId}`}
            src={imageUrl ?? undefined}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-[43px] w-[43px] object-contain"
            onError={() => setFailed(true)}
          />
        ) : (
          <Package className="h-5 w-5 text-slate-300" strokeWidth={1.5} aria-hidden />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span
          data-testid={`${testIdPrefix}-title-${orderId}`}
          className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-900"
        >
          {title}
        </span>
        {subtitle ? (
          <span
            data-testid={`${testIdPrefix}-subtitle-${orderId}`}
            className="mt-1 line-clamp-1 text-[12px] text-slate-500"
          >
            {subtitle}
          </span>
        ) : null}
        {tracking ? (
          <OrderTrackingProgressBar
            orderId={orderId}
            percent={tracking.percent}
            cancelled={tracking.cancelled}
            testIdPrefix={testIdPrefix}
          />
        ) : null}
      </span>
    </>
  );

  if (clickable && onClick) {
    return (
      <button
        type="button"
        data-testid={`${testIdPrefix}-list-item-${orderId}`}
        aria-label={ariaLabel}
        onClick={onClick}
        className={className}
      >
        {body}
      </button>
    );
  }

  return (
    <div
      data-testid={`${testIdPrefix}-list-item-${orderId}`}
      className={cn(className, "opacity-80")}
    >
      {body}
    </div>
  );
}
