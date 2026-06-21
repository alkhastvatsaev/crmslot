/**
 * Tokens visuels — panel droit hub dossiers (minimal premium, pipeline numéroté).
 */

export const CASE_HUB_DETAIL = {
  panel: "bg-white",

  stepSection: "border-b border-slate-100/90 py-4 last:border-b-0",
  stepHeader: "mb-3 flex items-center gap-2.5",
  stepNumber:
    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold tabular-nums text-white",
  stepTitle: "text-[12px] font-bold uppercase tracking-[0.12em] text-slate-500",
  stepBody: "min-w-0",

  title: "text-[20px] font-bold leading-tight tracking-tight text-slate-900",
  subtitle: "mt-1 text-[11px] font-medium text-slate-400",
  body: "text-[13px] leading-relaxed text-slate-600",

  statusPill:
    "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700",

  nextActionInline: "flex items-center gap-2.5 rounded-[16px] bg-slate-900 px-3.5 py-3 text-white",
  nextActionText: "text-[13px] font-semibold leading-snug",

  kpiList: "divide-y divide-slate-100/90 rounded-[16px] ring-1 ring-inset ring-slate-100",
  kpiRow: "flex items-center justify-between gap-3 px-3 py-2.5",
  kpiLabel: "text-[11px] font-medium text-slate-500",
  kpiValue: "text-[15px] font-bold tabular-nums text-slate-900",
  kpiValueSm: "text-[13px] font-semibold text-slate-800",

  contactRow:
    "flex min-w-0 items-center gap-2.5 rounded-[14px] bg-slate-50 px-3 py-2.5 text-[13px] font-medium text-slate-800 ring-1 ring-inset ring-slate-100 transition hover:bg-slate-100",

  btnPrimary:
    "flex w-full items-center justify-center gap-2 rounded-[16px] bg-slate-900 px-4 py-3 text-[14px] font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99]",
  btnSecondary:
    "flex w-full items-center justify-center gap-2 rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-[13px] font-semibold text-slate-800 transition hover:bg-slate-50 active:scale-[0.99]",

  drawerCard: "overflow-hidden rounded-[16px] bg-slate-50/50 ring-1 ring-inset ring-slate-100",
  photoTile:
    "aspect-square overflow-hidden rounded-[14px] bg-slate-100 ring-1 ring-inset ring-slate-100",

  empty:
    "flex min-h-[240px] flex-col items-center justify-center gap-3 px-8 text-center text-[13px] font-medium text-slate-400",
  emptyOrb: "h-11 w-11 rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/80",
} as const;

export const CASE_HUB_STATUS_DOT: Record<string, string> = {
  pending: "bg-slate-400",
  assigned: "bg-blue-500",
  en_route: "bg-indigo-500",
  in_progress: "bg-violet-500",
  waiting_material: "bg-amber-500",
  done: "bg-emerald-500",
  invoiced: "bg-green-500",
  cancelled: "bg-rose-500",
  pending_needs_address: "bg-orange-500",
};

export const CASE_HUB_ALERT_ACCENT: Record<string, string> = {
  rose: "bg-rose-50 text-rose-800",
  amber: "bg-amber-50 text-amber-900",
  sky: "bg-sky-50 text-sky-900",
  violet: "bg-violet-50 text-violet-900",
  emerald: "bg-emerald-50 text-emerald-900",
};

export const CASE_HUB_INSIGHT_DOT: Record<string, string> = {
  rose: "bg-rose-500",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
  slate: "bg-slate-400",
};

export const CASE_HUB_PAYMENT_TONE: Record<string, string> = {
  paid: "text-emerald-700",
  pending: "text-amber-700",
  unpaid: "text-slate-600",
  refunded: "text-slate-500",
};
