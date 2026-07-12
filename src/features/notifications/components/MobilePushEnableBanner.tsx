"use client";

import { BellRing, X } from "lucide-react";
import { useState } from "react";

type Props = {
  ariaLabel: string;
  hint: string;
  blockedHint: string;
  actionLabel: string;
  closeLabel: string;
  blocked?: boolean;
  showEnableButton?: boolean;
  visible?: boolean;
  onEnable: () => void;
  variant?: "default" | "warning";
};

/** Bannière mobile — geste utilisateur requis (iOS PWA) pour Notification.requestPermission(). */
export default function MobilePushEnableBanner({
  ariaLabel,
  hint,
  blockedHint,
  actionLabel,
  closeLabel,
  blocked = false,
  showEnableButton = true,
  visible = true,
  onEnable,
  variant = "default",
}: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (!visible || dismissed) return null;

  const borderClass = variant === "warning" ? "border-amber-200/90" : "border-slate-200/80";

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className="pointer-events-none fixed inset-x-0 top-[max(0.5rem,env(safe-area-inset-top))] z-[120] flex justify-center px-3"
    >
      <div
        className={`pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-2xl border ${borderClass} bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur`}
      >
        <p className="min-w-0 flex-1 text-[13px] leading-snug text-slate-800">
          {blocked ? blockedHint : hint}
        </p>
        {!blocked && showEnableButton ? (
          <button
            type="button"
            onClick={() => void onEnable()}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-[12px] font-semibold text-white"
          >
            <BellRing className="h-4 w-4" aria-hidden />
            {actionLabel}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          aria-label={closeLabel}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
