import type { Intervention } from "@/features/interventions";

// ---------------------------------------------------------------------------
// CSV Export for Interventions
// ---------------------------------------------------------------------------

const CSV_HEADERS = [
  "ID",
  "Titre",
  "Client",
  "Adresse",
  "Statut",
  "Date prévue",
  "Heure prévue",
  "Technicien",
  "Créé le",
  "Terminé le",
  "Montant facturé (€)",
  "Commission (€)",
  "Statut paiement",
  "Catégorie",
  "Urgence",
] as const;

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDateSafe(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toLocaleDateString("fr-BE");
  }
  return "";
}

function centsToEuros(cents: number | null | undefined): string {
  if (typeof cents !== "number") return "";
  return (cents / 100).toFixed(2);
}

export function interventionsToCSV(
  interventions: Intervention[],
  technicianNames?: Record<string, string>
): string {
  const rows: string[][] = [CSV_HEADERS as unknown as string[]];

  for (const iv of interventions) {
    const clientName =
      [iv.clientFirstName, iv.clientLastName].filter(Boolean).join(" ") || iv.clientName || "";

    rows.push([
      iv.id,
      iv.title || "",
      clientName,
      iv.address || "",
      iv.status,
      iv.scheduledDate || "",
      iv.scheduledTime || "",
      iv.assignedTechnicianUid
        ? (technicianNames?.[iv.assignedTechnicianUid] ?? iv.assignedTechnicianUid)
        : "",
      formatDateSafe(iv.createdAt),
      formatDateSafe(iv.completedAt),
      centsToEuros(iv.invoiceAmountCents),
      centsToEuros(iv.commissionAmountCents),
      iv.paymentStatus || "",
      iv.category || "",
      iv.urgency ? "Oui" : "Non",
    ]);
  }

  return rows.map((row) => row.map(escapeCSV).join(",")).join("\n");
}

/**
 * Triggers a browser download of the CSV file.
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * One-call helper: export interventions as CSV download.
 */
export function exportInterventionsCSV(
  interventions: Intervention[],
  technicianNames?: Record<string, string>
): void {
  const csv = interventionsToCSV(interventions, technicianNames);
  const date = new Date().toISOString().slice(0, 10);
  downloadCSV(csv, `interventions_${date}.csv`);
}
