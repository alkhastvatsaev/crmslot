import type { Intervention } from "@/features/interventions/types";
import type {
  WorkspaceCopilotClientRow,
  WorkspaceCopilotInterventionRow,
  WorkspaceCopilotSnapshot,
} from "@/features/copilot/types";

const MAX_INTERVENTIONS = 20;
const MAX_CLIENTS = 10;

function interventionClientName(iv: Intervention): string {
  const parts = [iv.clientFirstName, iv.clientLastName].filter(Boolean).join(" ").trim();
  if (parts) return parts;
  if (iv.clientName?.trim()) return iv.clientName.trim();
  if (iv.clientCompanyName?.trim()) return iv.clientCompanyName.trim();
  return iv.title?.trim() || "Client";
}

function interventionSortKey(iv: Intervention): number {
  const raw = iv.statusUpdatedAt || iv.createdAt || iv.scheduledDate || "";
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
}

function formatScheduled(iv: Intervention): string | null {
  const d = iv.scheduledDate || iv.date;
  const h = iv.scheduledTime || iv.hour;
  if (!d && !h) return null;
  return [d, h].filter(Boolean).join(" ");
}

export type BuildWorkspaceCopilotSnapshotInput = {
  locale: string;
  companyId: string;
  companyName: string | null;
  companyRole: string | null;
  interventions: Intervention[];
  pendingOfflineQueue: number;
  navigatorOnline: boolean;
};

export function buildWorkspaceCopilotSnapshot(
  input: BuildWorkspaceCopilotSnapshotInput,
): WorkspaceCopilotSnapshot {
  const { interventions } = input;
  const byStatus: Record<string, number> = {};
  let urgentOpen = 0;
  let awaitingAssignment = 0;
  let inProgress = 0;
  let doneOrInvoiced = 0;
  let unpaidCount = 0;
  let paidCount = 0;

  for (const iv of interventions) {
    const st = iv.status || "pending";
    byStatus[st] = (byStatus[st] ?? 0) + 1;
    if (iv.urgency && st !== "done" && st !== "invoiced" && st !== "cancelled") urgentOpen += 1;
    if (st === "pending" || st === "pending_needs_address") awaitingAssignment += 1;
    if (st === "assigned" || st === "en_route" || st === "in_progress" || st === "waiting_material") {
      inProgress += 1;
    }
    if (st === "done" || st === "invoiced") doneOrInvoiced += 1;
    if (iv.paymentStatus === "paid") paidCount += 1;
    else if (st === "done" || st === "invoiced" || iv.invoiceAmountCents) unpaidCount += 1;
  }

  const clientMap = new Map<string, WorkspaceCopilotClientRow>();
  for (const iv of interventions) {
    const name = interventionClientName(iv);
    const phone = iv.clientPhone || iv.phone || null;
    const key = `${name}|${phone ?? ""}`;
    const prev = clientMap.get(key);
    if (prev) prev.interventionCount += 1;
    else clientMap.set(key, { name, phone, interventionCount: 1 });
  }

  const clients = [...clientMap.values()]
    .sort((a, b) => b.interventionCount - a.interventionCount)
    .slice(0, MAX_CLIENTS);

  const sorted = [...interventions].sort((a, b) => interventionSortKey(b) - interventionSortKey(a));
  const interventionRows: WorkspaceCopilotInterventionRow[] = sorted
    .slice(0, MAX_INTERVENTIONS)
    .map((iv) => ({
      id: iv.id,
      title: iv.title || iv.problem || iv.id,
      status: iv.status,
      clientName: interventionClientName(iv),
      address: iv.address?.trim() || null,
      problem: iv.problem?.trim() || null,
      scheduled: formatScheduled(iv),
      paymentStatus: iv.paymentStatus ?? null,
      invoiceAmountEur:
        typeof iv.invoiceAmountCents === "number"
          ? Math.round(iv.invoiceAmountCents) / 100
          : null,
      urgency: Boolean(iv.urgency),
      hasAudio: Boolean(iv.audioUrl || iv.audioStoragePath || iv.transcription),
      hasInvoicePdf: Boolean(iv.invoicePdfUrl || iv.invoicePdfStoragePath),
      clientEmail: iv.clientEmail ?? null,
    }));

  return {
    generatedAt: new Date().toISOString(),
    locale: input.locale,
    company: {
      id: input.companyId,
      name: input.companyName,
      role: input.companyRole,
    },
    summary: {
      totalInterventions: interventions.length,
      byStatus,
      urgentOpen,
      awaitingAssignment,
      inProgress,
      doneOrInvoiced,
      unpaidCount,
      paidCount,
      pendingOfflineQueue: input.pendingOfflineQueue,
      navigatorOnline: input.navigatorOnline,
    },
    clients,
    interventions: interventionRows,
  };
}
