"use client";

import { useMemo } from "react";
import type { CrmActivityEvent } from "@/features/crmHistory/crmActivityTypes";

/** Grille KPI période — conservée pour réutilisation future. */
export default function CrmHistoryQmStatsGrid({ events }: { events: CrmActivityEvent[] }) {
  const s = useMemo(() => {
    let created = 0,
      completed = 0,
      invoiced = 0;
    let cancelled = 0,
      declined = 0,
      returned = 0;
    let materials = 0,
      emails = 0,
      billing = 0;
    for (const e of events) {
      if (e.type === "intervention_created") created++;
      else if (e.type === "intervention_completed") completed++;
      else if (e.type === "intervention_invoiced" || e.type === "intervention_report_validated")
        invoiced++;
      else if (e.type === "intervention_cancelled") cancelled++;
      else if (e.type === "intervention_technician_declined") declined++;
      else if (e.type === "intervention_returned_to_requests") returned++;
      else if (
        e.type === "material_ordered" ||
        e.type === "material_order_status_changed" ||
        e.type === "supplier_ordered" ||
        e.type === "supplier_order_lecot"
      )
        materials++;
      else if (e.type === "email_sent" || e.type === "email_received") emails++;
      else if (
        e.type === "intervention_billing_updated" ||
        e.type === "intervention_payment_updated"
      )
        billing++;
    }
    const rate = created > 0 ? Math.round((completed / created) * 100) : null;
    return {
      created,
      completed,
      rate,
      invoiced,
      cancelled,
      declined,
      returned,
      materials,
      emails,
      billing,
    };
  }, [events]);

  const cells: { value: string | number; label: string; accent: string; bg: string }[] = [
    { value: s.created, label: "Créées", accent: "text-blue-600", bg: "bg-blue-50/60" },
    { value: s.completed, label: "Clôturées", accent: "text-emerald-600", bg: "bg-emerald-50/60" },
    {
      value: s.rate !== null ? `${s.rate}%` : "—",
      label: "Taux",
      accent:
        s.rate === null
          ? "text-slate-400"
          : s.rate >= 70
            ? "text-emerald-600"
            : s.rate >= 40
              ? "text-amber-500"
              : "text-red-500",
      bg: "bg-white/60",
    },
    {
      value: s.cancelled,
      label: "Annulées",
      accent: s.cancelled > 0 ? "text-rose-500" : "text-slate-400",
      bg: "bg-rose-50/40",
    },
    {
      value: s.declined,
      label: "Refus tech",
      accent: s.declined > 0 ? "text-rose-400" : "text-slate-400",
      bg: "bg-rose-50/40",
    },
    {
      value: s.returned,
      label: "Retours",
      accent: s.returned > 0 ? "text-orange-500" : "text-slate-400",
      bg: "bg-orange-50/40",
    },
    { value: s.invoiced, label: "Facturées", accent: "text-teal-600", bg: "bg-teal-50/50" },
    { value: s.materials, label: "Matériaux", accent: "text-orange-600", bg: "bg-orange-50/50" },
    { value: s.emails, label: "Emails", accent: "text-sky-600", bg: "bg-sky-50/50" },
  ];

  return (
    <div className="shrink-0 grid grid-cols-3 gap-px border-b border-black/5 bg-black/5">
      {cells.map(({ value, label, accent, bg }) => (
        <div key={label} className={`flex flex-col items-center justify-center py-3 gap-0.5 ${bg}`}>
          <span className={`text-[20px] font-bold tabular-nums leading-none ${accent}`}>
            {value}
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
