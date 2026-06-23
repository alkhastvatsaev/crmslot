import type { Technician } from "@/features/technicians";

export const BACK_OFFICE_DASHBOARD_SELECT_CLASS =
  "flex h-10 w-full cursor-pointer appearance-none rounded-[14px] border border-black/[0.06] bg-white/95 py-2 pl-3 pr-3 text-sm font-medium text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15";

export const BACK_OFFICE_DASHBOARD_DATE_INPUT_CLASS =
  "flex h-10 w-full rounded-[14px] border border-black/[0.06] bg-white/95 px-3 text-sm font-medium text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15";

export function formatBackOfficeDashboardEuro(n: number): string {
  return new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(n);
}

export function backOfficeTechnicianOptionLabel(uid: string, technicians: Technician[]): string {
  const tech = technicians.find((x) => x.id === uid);
  return tech?.name?.trim() ? `${tech.name} (${uid.slice(0, 6)}…)` : uid;
}
