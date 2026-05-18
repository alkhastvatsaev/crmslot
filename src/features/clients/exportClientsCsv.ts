import type { ClientRecord } from "./types";
import { buildClientDisplayName } from "./clientDisplayName";

export function clientsToCsv(clients: ClientRecord[]): string {
  const header = "displayName;firstName;lastName;phone;email;companyName";
  const rows = clients.map((c) => {
    const cells = [
      buildClientDisplayName(c) || c.displayName,
      c.firstName ?? "",
      c.lastName ?? "",
      c.phone ?? "",
      c.email ?? "",
      c.companyName ?? "",
    ];
    return cells.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";");
  });
  return [header, ...rows].join("\n");
}

export function downloadClientsCsv(clients: ClientRecord[], filename = "clients-export.csv"): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([clientsToCsv(clients)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
