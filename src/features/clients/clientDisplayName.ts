import type { ClientRecord } from "./types";

export function buildClientDisplayName(
  input: Pick<ClientRecord, "displayName" | "firstName" | "lastName" | "companyName">,
): string {
  const explicit = input.displayName?.trim();
  if (explicit) return explicit;
  const person = [input.firstName, input.lastName].filter(Boolean).join(" ").trim();
  if (person) return person;
  return input.companyName?.trim() || "";
}
