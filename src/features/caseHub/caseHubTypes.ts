export type CaseHubBucket =
  | "to_assign"
  | "in_progress"
  | "waiting"
  | "to_invoice"
  | "invoiced"
  | "cancelled"
  | "all";

/** @deprecated kept for legacy callers — prefer CaseHubBucket. */
export type CaseHubStatusFilter = "all" | "open" | "active" | "done";
