export function formatQuoteEur(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

export function computeQuoteTotals(lines: { quantity: number; unitPriceCents: number }[]) {
  const totalHT = lines.reduce((s, l) => s + Math.round(l.quantity * l.unitPriceCents), 0);
  const tva = Math.round(totalHT * 0.06);
  const totalTTC = totalHT + tva;
  return { totalHT, tva, totalTTC };
}
