import type { Intervention } from "@/features/interventions/types";

export interface AccountingRow {
  date: string;
  interventionId: string;
  clientName: string;
  address: string;
  paymentStatus: string;
  subtotalHtCents: number;
  tvaRate: number;
  tvaCents: number;
  totalTtcCents: number;
  lines: string;
}

const TVA_RATE = 0.06;

function escapeCell(val: string | number): string {
  return `"${String(val).replace(/"/g, '""')}"`;
}

export function interventionsToAccountingRows(interventions: Intervention[]): AccountingRow[] {
  return interventions
    .filter((iv) => (iv.billingLines?.length ?? 0) > 0)
    .map((iv) => {
      const subtotalHtCents = (iv.billingLines ?? []).reduce(
        (s, l) => s + l.quantity * l.unitPriceCents,
        0,
      );
      const tvaCents = Math.round(subtotalHtCents * TVA_RATE);
      const totalTtcCents = subtotalHtCents + tvaCents;
      const lines = (iv.billingLines ?? [])
        .map((l) => `${l.description} x${l.quantity}`)
        .join(" | ");

      const rawDate = (iv as unknown as { createdAt?: unknown; scheduledAt?: unknown }).createdAt
        ?? (iv as unknown as { scheduledAt?: unknown }).scheduledAt;
      const date = rawDate ? new Date(rawDate as string).toISOString().slice(0, 10) : "";

      return {
        date,
        interventionId: iv.id,
        clientName: iv.clientName ?? "",
        address: iv.address ?? "",
        paymentStatus: iv.paymentStatus ?? "unpaid",
        subtotalHtCents,
        tvaRate: TVA_RATE * 100,
        tvaCents,
        totalTtcCents,
        lines,
      };
    });
}

export function accountingRowsToCsv(rows: AccountingRow[]): string {
  const header = [
    "Date",
    "ID intervention",
    "Client",
    "Adresse",
    "Statut paiement",
    "HT (€)",
    "TVA %",
    "TVA (€)",
    "TTC (€)",
    "Lignes",
  ].join(";");

  const body = rows.map((r) =>
    [
      escapeCell(r.date),
      escapeCell(r.interventionId),
      escapeCell(r.clientName),
      escapeCell(r.address),
      escapeCell(r.paymentStatus),
      escapeCell((r.subtotalHtCents / 100).toFixed(2)),
      escapeCell(r.tvaRate.toFixed(0)),
      escapeCell((r.tvaCents / 100).toFixed(2)),
      escapeCell((r.totalTtcCents / 100).toFixed(2)),
      escapeCell(r.lines),
    ].join(";"),
  );

  return [header, ...body].join("\n");
}

export function downloadAccountingCsv(
  interventions: Intervention[],
  filename = "export-comptable.csv",
): void {
  if (typeof document === "undefined") return;
  const rows = interventionsToAccountingRows(interventions);
  const csv = accountingRowsToCsv(rows);
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
