import type { Intervention } from "@/features/interventions/types";

export function newAssignmentIdsFromSnapshotChanges(
  changes: ReadonlyArray<{ type: string; docId: string }>,
  knownIds: ReadonlySet<string>
): string[] {
  const ids: string[] = [];
  for (const change of changes) {
    if (change.type !== "added") continue;
    if (knownIds.has(change.docId)) continue;
    ids.push(change.docId);
  }
  return ids;
}

export function interventionAssignmentPreview(iv: Intervention): string {
  const title = iv.title?.trim() || iv.problem?.trim();
  if (title) return title.slice(0, 120);
  const client =
    [iv.clientFirstName, iv.clientLastName].filter(Boolean).join(" ").trim() ||
    iv.clientName?.trim();
  if (client) return client.slice(0, 120);
  return "Nouvelle intervention";
}

export function showTechnicianNewAssignmentNotification(
  title: string,
  body: string,
  tag: string
): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    // eslint-disable-next-line no-new
    new Notification(title, { body, tag });
  } catch {
    /* ignore */
  }
}
