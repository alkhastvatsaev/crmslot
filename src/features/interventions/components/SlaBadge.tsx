"use client";

import { Clock, AlertTriangle } from "lucide-react";
import { checkSla } from "@/features/interventions/slaUtils";
import type { Intervention } from "@/features/interventions/types";
import { cn } from "@/lib/utils";

interface Props {
  intervention: Intervention;
  className?: string;
}

export default function SlaBadge({ intervention, className }: Props) {
  const sla = checkSla(intervention);
  if (!sla || sla.status === "ok") return null;

  return (
    <span
      data-testid="sla-badge"
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
        sla.status === "critical"
          ? "bg-red-100 text-red-700"
          : "bg-amber-100 text-amber-700",
        className,
      )}
    >
      {sla.status === "critical"
        ? <AlertTriangle className="h-3 w-3" />
        : <Clock className="h-3 w-3" />}
      {sla.label}
    </span>
  );
}
