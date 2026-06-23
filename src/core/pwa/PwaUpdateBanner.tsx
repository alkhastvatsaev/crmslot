"use client";

import { RefreshCcw } from "lucide-react";

type Props = {
  visible: boolean;
  onReload: () => void;
  onDismiss?: () => void;
};

/** Bannière mise à jour PWA — présentation minimale (Claude Code peut polisher le style). */
export default function PwaUpdateBanner({ visible, onReload, onDismiss }: Props) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[10000] flex items-center gap-3 border-b border-amber-500/40 bg-amber-950/95 px-4 text-white shadow-lg backdrop-blur-md"
      style={{
        paddingTop: "max(0.625rem, env(safe-area-inset-top, 0px))",
        paddingBottom: "0.625rem",
      }}
      role="status"
      aria-live="polite"
      data-testid="pwa-update-banner"
    >
      <span
        aria-hidden
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-amber-300"
      >
        <RefreshCcw className="h-4 w-4" />
      </span>

      <p className="min-w-0 flex-1 text-[13px] font-medium leading-snug">
        Une nouvelle version est disponible.
      </p>

      <div className="flex flex-shrink-0 items-center gap-1.5">
        {onDismiss ? (
          <button
            type="button"
            className="rounded-lg px-3 text-[12px] font-medium text-white/75 transition-colors hover:bg-white/10 active:bg-white/15"
            style={{ minHeight: "2.75rem" }}
            onClick={onDismiss}
          >
            Plus tard
          </button>
        ) : null}
        <button
          type="button"
          className="rounded-lg bg-amber-400 px-3.5 text-[12px] font-semibold text-amber-950 shadow-sm transition-colors hover:bg-amber-300 active:bg-amber-500"
          style={{ minHeight: "2.75rem" }}
          onClick={onReload}
        >
          Mettre à jour
        </button>
      </div>
    </div>
  );
}
