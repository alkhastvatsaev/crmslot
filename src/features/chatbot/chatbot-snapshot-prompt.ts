import type { WorkspaceCopilotSnapshot } from "@/features/copilot/types";

/** Contexte PWA sérialisé pour le prompt (taille maîtrisée). */
export function formatWorkspaceSnapshotForPrompt(snapshot: WorkspaceCopilotSnapshot): string {
  return JSON.stringify(
    {
      generatedAt: snapshot.generatedAt,
      company: snapshot.company,
      summary: snapshot.summary,
      clientsTop: snapshot.clients.slice(0, 20),
      interventions: snapshot.interventions.slice(0, 45),
    },
    null,
    0,
  );
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
