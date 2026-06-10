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
  size?: "default" | "compact";
};

export default function ChatbotOrderGridTile({
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
  size = "default",
}: Props) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !failed;
  const compact = size === "compact";

  const body = (
    <>
      <span className="flex min-h-0 flex-1 items-center justify-center">
        <span
          className={cn(
            "relative flex items-center justify-center",
            compact ? "h-[62%] w-[62%]" : "h-[70%] w-[70%]"
          )}
        >
          {showImage ? (
            <img
              data-testid={`${testIdPrefix}-image-${orderId}`}
              src={imageUrl ?? undefined}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain"
              onError={() => setFailed(true)}
            />
          ) : (
            <Package
              className={cn("text-slate-300", compact ? "h-[16px] w-[16px]" : "h-[22px] w-[22px]")}
              strokeWidth={1.5}
              aria-hidden
            />
          )}
        </span>
      </span>
      <span
        data-testid={`${testIdPrefix}-title-${orderId}`}
        className={cn(
          "line-clamp-2 text-center font-semibold leading-snug text-slate-900",
          compact ? "mt-1 text-[9px]" : "mt-1.5 text-[10px]"
        )}
      >
        {title}
      </span>
      {subtitle ? (
        <span
          data-testid={`${testIdPrefix}-subtitle-${orderId}`}
          className={cn(
            "line-clamp-1 text-center text-slate-500",
            compact ? "mt-0.5 text-[8px]" : "mt-0.5 text-[9px]"
          )}
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
    </>
  );

  const className = cn(
    "flex aspect-square w-full flex-col overflow-hidden rounded-[12px] bg-white text-left transition",
    compact ? "p-1" : "p-1.5",
    highlighted && "ring-2 ring-slate-300/80",
    clickable && "hover:bg-slate-50/80"
  );

  if (clickable && onClick) {
    return (
      <button
        type="button"
        data-testid={`${testIdPrefix}-tile-${orderId}`}
        aria-label={ariaLabel}
        onClick={onClick}
        className={className}
      >
        {body}
      </button>
    );
  }

  return (
    <div data-testid={`${testIdPrefix}-tile-${orderId}`} className={cn(className, "opacity-80")}>
      {body}
    </div>
  );
}
