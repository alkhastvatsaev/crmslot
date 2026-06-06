/**
 * BELGMAP hub UI tokens — inner rails inside `GlassPanel` shells.
 * Shell chrome (24px glass) lives in `panel-tokens.css` + `glassPanelChrome.ts`.
 */

import { cn } from "@/lib/utils";

export const HUB_FONT_OUTFIT = { fontFamily: "'Outfit', sans-serif" } as const;

/** Standard vertical rhythm inside hub rails (matches `DASHBOARD_DESKTOP_PANEL_GAP_CLASS`). */
export const HUB_RAIL_BODY_CLASS = "flex min-h-0 flex-1 flex-col gap-6 scroll-mt-2";

export const HUB_RADIUS = {
  card: "rounded-[16px]",
  control: "rounded-[16px]",
  input: "rounded-[12px]",
  pill: "rounded-full",
  icon: "rounded-[16px]",
} as const;

export const HUB_SURFACE = {
  track: "rounded-[16px] border border-slate-300/30 bg-slate-200/50 p-1.5",
  card: "rounded-[16px] border border-slate-100 bg-white",
  cardMuted: "rounded-[16px] border border-slate-100 bg-slate-50/40",
  muted: "bg-slate-50/30",
  mutedSolid: "bg-slate-50",
  fieldRow:
    "rounded-[16px] bg-white/85 px-3 py-2.5 backdrop-blur-sm shadow-[0_6px_20px_-8px_rgba(15,23,42,0.12)]",
} as const;

/** Fond app / gates — aligné sur `body` (`#f8fafc` ≈ slate-50) */
export const HUB_APP_BG_CLASS = "bg-slate-50";

export const HUB_TYPE = {
  eyebrow: "text-[11px] font-bold uppercase tracking-widest text-slate-400",
  title: "text-[15px] font-semibold tracking-tight text-slate-900",
  titleLg: "text-[17px] font-bold tracking-tight text-slate-900",
  segmentLabel: "text-[11px] font-bold sm:text-[12px]",
  body: "text-[13px] font-medium text-slate-700",
} as const;

export const HUB_FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20";

/** Champs texte / recherche dans les rails hub */
export const HUB_FIELD_CLASS = cn(
  HUB_RADIUS.input,
  "w-full border border-black/[0.06] bg-white/85 px-3.5 py-2.5 text-[13px] font-medium text-slate-800 placeholder:text-slate-400 outline-none transition focus-visible:ring-2 focus-visible:ring-slate-900/15"
);

/** Carte mission technicien (liste gauche hub) */
export const HUB_MISSION_CASE = {
  base: "flex w-full items-center gap-3 rounded-[16px] border px-3 py-3.5 text-left transition active:scale-[0.98]",
  selected: "border-slate-900 bg-slate-50",
  default: "border-slate-200/80 bg-white hover:bg-slate-50",
  archived: "opacity-60",
  offerBase: "w-full cursor-pointer rounded-[16px] border px-3 py-2.5 transition-all",
  offerSelected: "border-slate-900 bg-slate-50",
  offerDefault: "border-slate-200/80 bg-white hover:bg-slate-50",
} as const;

export const HUB_MISSION_BRIEF_CARD =
  "flex min-h-0 w-full max-w-[20.5rem] shrink flex-col overflow-hidden rounded-[16px] border border-slate-100 bg-white px-5 py-5 shadow-[0_14px_36px_-18px_rgba(15,23,42,0.14)]";

export const HUB_ACTIVE_ACCENT = {
  slate: "text-slate-900",
  blue: "text-blue-600",
  rose: "text-rose-600",
  emerald: "text-emerald-600",
} as const;

export type HubActiveAccent = keyof typeof HUB_ACTIVE_ACCENT;

export const HUB_BADGE_ACCENT = {
  blue: "bg-blue-100 text-blue-600 border-blue-200",
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  slate: "bg-slate-100 text-slate-600 border-slate-200",
} as const;

export type HubBadgeAccent = keyof typeof HUB_BADGE_ACCENT;
