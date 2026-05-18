import type { WorkspaceCopilotSnapshot } from "@/features/copilot/types";

/** Suggestions contextuelles (rail gauche + chips chat). */
export function buildChatbotSuggestions(snapshot: WorkspaceCopilotSnapshot | null): string[] {
  if (!snapshot) {
    return [
      "Briefing du jour",
      "Interventions urgentes",
      "Résumé de la société",
    ];
  }

  const { summary } = snapshot;
  const out: string[] = [];

  if (summary.urgentOpen > 0) {
    out.push(`${summary.urgentOpen} urgence(s) ouverte(s) — détail`);
  }
  if (summary.awaitingAssignment > 0) {
    out.push(`${summary.awaitingAssignment} dossier(s) à assigner`);
  }
  if (summary.unpaidCount > 0) {
    out.push(`Impayés : ${summary.unpaidCount} dossier(s)`);
  }
  if (summary.pendingOfflineQueue > 0) {
    out.push(`File offline : ${summary.pendingOfflineQueue} en attente`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = snapshot.interventions.filter((iv) =>
    iv.scheduled?.startsWith(today),
  ).length;
  if (todayCount > 0) {
    out.push(`Interventions prévues aujourd'hui (${todayCount})`);
  }

  out.push("Résumé chiffre d'affaires et statuts");
  out.push("Notifications inbox non lues");
  out.push("Stock en alerte");

  return [...new Set(out)].slice(0, 8);
}
