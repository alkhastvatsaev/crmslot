import type {
  CommissionLevel,
  CommissionRule,
  CommissionValueType,
} from "@/features/commissions/types";

export const COMMISSION_LEVEL_RING: Record<CommissionLevel, string> = {
  group: "ring-sky-200/90",
  technician: "ring-violet-200/90",
  intervention: "ring-amber-200/90",
};

export const COMMISSION_LEVEL_BADGE: Record<CommissionLevel, string> = {
  group: "bg-sky-100 text-sky-800",
  technician: "bg-violet-100 text-violet-800",
  intervention: "bg-amber-100 text-amber-800",
};

export function formatCommissionValue(valueType: CommissionValueType, value: number): string {
  if (valueType === "percentage") return `${value}%`;
  return `${value} €`;
}

export function formatCommissionTargetShort(rule: CommissionRule): string {
  const id = rule.targetId.trim();
  if (rule.level === "group") return "Société";
  return id.length > 10 ? `…${id.slice(-8)}` : id;
}
