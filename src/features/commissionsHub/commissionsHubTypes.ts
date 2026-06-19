import type { CommissionLevel } from "@/features/commissions/types";

export type CommissionsHubMode = "team" | "rules" | "manual" | "history";

export type CommissionsHubLevelFilter = "all" | CommissionLevel;

export type CommissionsHubSelection =
  | { kind: "none" }
  | { kind: "new-rule"; level?: CommissionLevel; targetId?: string }
  | { kind: "rule"; id: string }
  | { kind: "manual"; id: string }
  | { kind: "technician"; uid: string };
