"use client";

import { RefreshCcw } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";

type Props = {
  visible: boolean;
  onReload: () => void;
  onDismiss?: () => void;
};

/** Bannière mise à jour PWA — présentation + i18n (FR/EN/NL/RU). */
export default function PwaUpdateBanner({ visible, onReload, onDismiss }: Props) {
  const { t } = useTranslation();
  if (!visible) return null;

  const title = String(t("pwa.update_banner.title"));
  const laterLabel = String(t("pwa.update_banner.later"));
  const updateLabel = String(t("pwa.update_banner.update"));

  return (
    <div
      className="fixed inset-x-0 top-0 z-[10000] flex items-center gap-3 border-b border-amber-400/30 bg-gradient-to-b from-amber-950/96 to-amber-900/96 px-4 text-white shadow-[0_6px_18px_-6px_rgb(15_23_42/0.45)] backdrop-blur-md"
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
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-amber-300 ring-1 ring-amber-300/20"
      >
        <RefreshCcw className="h-4 w-4" />
      </span>

      <p className="min-w-0 flex-1 truncate text-[13px] font-medium leading-snug">{title}</p>

      <div className="flex flex-shrink-0 items-center gap-1.5">
        {onDismiss ? (
          <button
            type="button"
            className="rounded-lg px-3 text-[12px] font-medium text-white/75 transition-colors hover:bg-white/10 active:bg-white/15"
            style={{ minHeight: "2.75rem" }}
            onClick={onDismiss}
            data-testid="pwa-update-banner-later"
          >
            {laterLabel}
          </button>
        ) : null}
        <button
          type="button"
          className="rounded-lg bg-amber-400 px-3.5 text-[12px] font-semibold text-amber-950 shadow-sm transition-colors hover:bg-amber-300 active:bg-amber-500"
          style={{ minHeight: "2.75rem" }}
          onClick={onReload}
          data-testid="pwa-update-banner-update"
        >
          {updateLabel}
        </button>
      </div>
    </div>
  );
}
