import type { StockHealth } from "@/features/featureHub/companyStockMetrics";

/**
 * Palette « entre-deux » — statuts lisibles, teintes sourdes (ni Disneyland ni cimetière).
 * OK = teal · Bas = amber · Rupture = rose
 */
export const STOCK_HEALTH_STRIPE: Record<StockHealth, string> = {
  out: "bg-rose-600",
  low: "bg-amber-500",
  ok: "bg-teal-500",
};

export const STOCK_HEALTH_BAR: Record<StockHealth, string> = {
  out: "bg-rose-500/85",
  low: "bg-amber-400/90",
  ok: "bg-teal-500/80",
};

export const STOCK_HEALTH_DOT: Record<StockHealth, string> = {
  out: "bg-rose-500",
  low: "bg-amber-500",
  ok: "bg-teal-500",
};

export const STOCK_HEALTH_TEXT: Record<StockHealth, string> = {
  out: "text-rose-700",
  low: "text-amber-800",
  ok: "text-teal-700",
};

export const STOCK_HEALTH_ICON: Record<StockHealth, string> = {
  out: "text-rose-600",
  low: "text-amber-700",
  ok: "text-teal-600",
};

export const STOCK_HEALTH_ICON_BG: Record<StockHealth, string> = {
  out: "border-rose-100/90 bg-rose-50 text-rose-600",
  low: "border-amber-100/90 bg-amber-50 text-amber-700",
  ok: "border-teal-100/90 bg-teal-50 text-teal-600",
};

export const STOCK_HEALTH_CARD_BORDER: Record<StockHealth, string> = {
  out: "border-rose-200/70",
  low: "border-amber-200/65",
  ok: "border-slate-200/70",
};

export const STOCK_HEALTH_CARD_BG: Record<StockHealth, string> = {
  out: "bg-rose-50/25",
  low: "bg-amber-50/20",
  ok: "bg-white",
};

export const STOCK_PULSE_SEGMENT = {
  ok: "bg-teal-500/75",
  low: "bg-amber-400/85",
  out: "bg-rose-500/80",
} as const;

/** Anneau discret autour du % quand il y a des alertes. */
export function stockPulseRingGradient(outPct: number, lowPct: number): string {
  const cut = outPct + lowPct;
  return `conic-gradient(#e11d48 0 ${outPct}%, #f59e0b ${outPct}% ${cut}%, #14b8a6 ${cut}% 100%)`;
}

export const STOCK_SIGNAL = {
  jobs: "border-sky-100/90 bg-sky-50/80 text-sky-700",
} as const;
