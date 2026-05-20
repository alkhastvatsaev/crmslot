import type { SupplierOrderStatus } from "@/features/suppliers/types";

/** Étapes affichées en démo (suivi client / fournisseur). */
export const DEMO_SUPPLIER_ORDER_STEPS = [
  { key: "validated", label: "Validée" },
  { key: "preparing", label: "Préparation" },
  { key: "shipped", label: "Expédiée" },
  { key: "delivered", label: "Livrée" },
] as const;

export type DemoSupplierOrderProgress = {
  activeIndex: number;
  percent: number;
  cancelled: boolean;
};

const STATUS_TO_DEMO_INDEX: Record<SupplierOrderStatus, number> = {
  draft: 0,
  sent: 1,
  confirmed: 2,
  delivered: 3,
  cancelled: -1,
};

/** Pourcentage de la barre (démo) — aligné sur l’étape active. */
const DEMO_PERCENT_BY_INDEX = [18, 45, 72, 100] as const;

/**
 * Progression démo d’une commande fournisseur (page 5, rail Commandes).
 * Les commandes réelles n’affichent pas ce suivi pour l’instant.
 */
export function resolveDemoSupplierOrderProgress(
  status: SupplierOrderStatus | string,
): DemoSupplierOrderProgress {
  const key = status as SupplierOrderStatus;
  if (key === "cancelled") {
    return { activeIndex: -1, percent: 0, cancelled: true };
  }
  const activeIndex = STATUS_TO_DEMO_INDEX[key] ?? 0;
  const percent =
    activeIndex >= 0 && activeIndex < DEMO_PERCENT_BY_INDEX.length
      ? DEMO_PERCENT_BY_INDEX[activeIndex]
      : 18;
  return { activeIndex, percent, cancelled: false };
}
