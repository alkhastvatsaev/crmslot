/**
 * API publique sla — calcul SLA + badge urgence.
 */
export { computeSlaStatus } from "@/features/sla/computeSla";
export type { SlaUrgency, SlaStatus } from "@/features/sla/computeSla";
export { SLA_RULES, PRIORITY_LABELS } from "@/features/sla/slaConfig";
export type { SlaPriority, SlaRule } from "@/features/sla/slaConfig";
export { default as SlaStatusBadge } from "@/features/sla/components/SlaStatusBadge";
