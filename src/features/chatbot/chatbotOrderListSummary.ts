import type { MaterialOrderPart } from "@/features/materials";
import type { SupplierOrderLine } from "@/features/suppliers";

type LineLike = { label: string; quantity?: number };

/** Résumé court des lignes — titre visible dans la liste commandes. */
export function summarizeOrderLineLabels(lines: LineLike[], maxVisible = 2): string {
  const items = lines
    .map(({ label, quantity }) => {
      const name = label.trim();
      if (!name) return "";
      const q = quantity ?? 1;
      return q > 1 ? `${q}× ${name}` : name;
    })
    .filter(Boolean);

  if (items.length === 0) return "";
  if (items.length === 1) return items[0]!;
  if (items.length <= maxVisible) return items.join(" · ");

  const head = items.slice(0, maxVisible - 1).join(" · ");
  const rest = items.length - (maxVisible - 1);
  return `${head} · +${rest}`;
}

export function summarizeSupplierOrderLines(lines: SupplierOrderLine[]): string {
  return summarizeOrderLineLabels(
    lines.map((line) => ({
      label: line.label?.trim() || line.sku?.trim() || "",
      quantity: line.quantity,
    }))
  );
}

export function summarizeMaterialOrderParts(parts: MaterialOrderPart[]): string {
  return summarizeOrderLineLabels(
    parts.map((part) => ({
      label: part.description?.trim() || part.reference?.trim() || "",
      quantity: part.quantity,
    }))
  );
}
