import { buildClientDisplayName } from "./clientDisplayName";
import type { ClientRecord } from "./types";

export type ClientCsvRow = Pick<
  ClientRecord,
  "firstName" | "lastName" | "companyName" | "phone" | "email" | "displayName"
>;

const HEADER_ALIASES: Record<string, keyof ClientCsvRow> = {
  prenom: "firstName",
  prénom: "firstName",
  firstname: "firstName",
  first_name: "firstName",
  nom: "lastName",
  lastname: "lastName",
  last_name: "lastName",
  societe: "companyName",
  société: "companyName",
  company: "companyName",
  companyname: "companyName",
  entreprise: "companyName",
  telephone: "phone",
  téléphone: "phone",
  phone: "phone",
  tel: "phone",
  email: "email",
  mail: "email",
  displayname: "displayName",
  name: "displayName",
  client: "displayName",
};

function splitLine(line: string): string[] {
  if (line.includes(";")) return line.split(";").map((c) => c.trim());
  return line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
}

function normalizeHeader(cell: string): string {
  return cell
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function parseClientsCsv(text: string): ClientCsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const firstCells = splitLine(lines[0]!);
  const headerKeys = firstCells.map((c) => HEADER_ALIASES[normalizeHeader(c)]);
  const hasHeader = headerKeys.some(Boolean);
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const rows: ClientCsvRow[] = [];
  for (const line of dataLines) {
    const cells = splitLine(line);
    if (cells.every((c) => !c)) continue;

    const row: ClientCsvRow = {
      displayName: "",
      firstName: null,
      lastName: null,
      companyName: null,
      phone: null,
      email: null,
    };

    if (hasHeader) {
      for (let i = 0; i < cells.length; i++) {
        const key = headerKeys[i];
        const val = cells[i]?.trim();
        if (!key || !val) continue;
        row[key] = val;
      }
    } else {
      row.firstName = cells[0] || null;
      row.lastName = cells[1] || null;
      row.phone = cells[2] || null;
      row.email = cells[3] || null;
      row.companyName = cells[4] || null;
    }

    const displayName =
      row.displayName?.trim() ||
      buildClientDisplayName({
        displayName: "",
        firstName: row.firstName,
        lastName: row.lastName,
        companyName: row.companyName,
      });
    if (!displayName) continue;
    row.displayName = displayName;
    rows.push(row);
  }

  return rows;
}
