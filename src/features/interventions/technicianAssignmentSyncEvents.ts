/** Force un pull serveur des missions technicien (push FCM ou autre). */
export const TECHNICIAN_ASSIGNMENTS_RESYNC_EVENT = "crmslot:technician-assignments-resync";

export function requestTechnicianAssignmentsResync(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(TECHNICIAN_ASSIGNMENTS_RESYNC_EVENT));
}
