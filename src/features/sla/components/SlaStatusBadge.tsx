"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { computeSlaStatus } from "../computeSla";
import { PRIORITY_LABELS } from "../slaConfig";
import type { Intervention } from "@/features/interventions/types";

const URGENCY_STYLES = {
  ok: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  breach: "bg-red-100 text-red-600",
};

const URGENCY_ICONS = {
  ok: CheckCircle,
  warning: Clock,
  breach: AlertTriangle,
};

type Props = {
  intervention: Intervention;
  className?: string;
};

export default function SlaStatusBadge({ intervention, className }: Props) {
  const sla = computeSlaStatus(intervention);
  if (!sla) return null;

  const Icon = URGENCY_ICONS[sla.urgency];

  const label =
    sla.urgency === "breach"
      ? `SLA dépassé — ${PRIORITY_LABELS[sla.priority]}`
      : sla.urgency === "warning"
        ? `SLA critique — ${PRIORITY_LABELS[sla.priority]}`
        : `SLA OK — ${PRIORITY_LABELS[sla.priority]}`;

  return (
    <span
      data-testid="sla-status-badge"
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
        URGENCY_STYLES[sla.urgency],
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
