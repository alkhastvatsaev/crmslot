/** Commande Lecot : quantité 1 si le modèle omet ou demande quantity à l'utilisateur. */
export function normalizeLecotOrderToolArguments(args: Record<string, unknown>): void {
  if (!Array.isArray(args.lines)) return;
  for (const row of args.lines) {
    if (!row || typeof row !== "object") continue;
    const line = row as Record<string, unknown>;
    const q = Number(line.quantity);
    if (!Number.isFinite(q) || q <= 0) line.quantity = 1;
  }
}
