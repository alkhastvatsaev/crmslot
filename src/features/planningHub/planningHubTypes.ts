export type PlanningSlotKind = "free" | "busy" | "conflict";

export type PlanningHubSlot = {
  time: string;
  label: string;
  kind: PlanningSlotKind;
  interventionId?: string;
};

export type PlanningTechnicianRow = {
  uid: string;
  name: string;
  initial: string;
  missionCount: number;
  status: "available" | "on-mission" | "idle";
};

export type PlanningPendingRow = {
  id: string;
  clientLabel: string;
  slotLabel: string;
  state: "unassigned" | "awaiting_accept";
};
