import type { WorkspaceCopilotSnapshot } from "@/features/copilot/types";

/** Contexte PWA compact pour limiter les tokens (le détail = outils ciblés). */
export function formatWorkspaceSnapshotForPrompt(snapshot: WorkspaceCopilotSnapshot): string {
  const { totalInterventions, byStatus, urgentOpen, awaitingAssignment, inProgress, unpaidCount } =
    snapshot.summary;
  return JSON.stringify({
    company: { id: snapshot.company.id, name: snapshot.company.name, role: snapshot.company.role },
    summary: { totalInterventions, byStatus, urgentOpen, awaitingAssignment, inProgress, unpaidCount },
    clients: snapshot.clients.slice(0, 6).map((c) => ({ n: c.name, i: c.interventionCount })),
    dossiers: snapshot.interventions.slice(0, 15).map((iv) => ({
      id: iv.id,
      st: iv.status,
      cl: iv.clientName,
      adr: iv.address?.slice(0, 50) ?? null,
      urg: iv.urgency || undefined,
      em: iv.clientEmail || undefined,
    })),
  });
}

export function isWorkspaceCopilotSnapshot(value: unknown): value is WorkspaceCopilotSnapshot {
  if (!value || typeof value !== "object") return false;
  const s = value as WorkspaceCopilotSnapshot;
  return (
    typeof s.generatedAt === "string" &&
    Boolean(s.company?.id) &&
    Array.isArray(s.interventions) &&
    typeof s.summary === "object"
  );
}
