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

export const SUPPLIER_ORDER_DELIVERY_DAYS = 2;
export const SUPPLIER_ORDER_DELIVERY_MS = SUPPLIER_ORDER_DELIVERY_DAYS * 24 * 60 * 60 * 1000;

export type SupplierOrderProgressInput = {
  status: SupplierOrderStatus | string;
  createdAt?: unknown;
  sentAt?: unknown;
  deliveredAt?: unknown;
  /** Horodatage de référence pour les tests (défaut : Date.now()). */
  now?: number;
};

export function parseSupplierOrderTimestamp(raw: unknown): number | null {
  if (!raw) return null;
  if (typeof raw === "object" && raw !== null && "seconds" in raw) {
    return (raw as { seconds: number }).seconds * 1000;
  }
  const ms = Date.parse(String(raw));
  return Number.isFinite(ms) ? ms : null;
}

function resolveStatusFallbackProgress(status: SupplierOrderStatus): DemoSupplierOrderProgress {
  const STATUS_TO_DEMO_INDEX: Record<SupplierOrderStatus, number> = {
    draft: 0,
    sent: 1,
    confirmed: 2,
    delivered: 3,
    cancelled: -1,
  };
  const DEMO_PERCENT_BY_INDEX = [10, 35, 65, 100] as const;
  const activeIndex = STATUS_TO_DEMO_INDEX[status] ?? 0;
  const percent =
    activeIndex >= 0 && activeIndex < DEMO_PERCENT_BY_INDEX.length
      ? DEMO_PERCENT_BY_INDEX[activeIndex]
      : 10;
  return { activeIndex, percent, cancelled: false };
}

function activeIndexFromPercent(percent: number): number {
  if (percent >= 100) return DEMO_SUPPLIER_ORDER_STEPS.length - 1;
  return Math.min(DEMO_SUPPLIER_ORDER_STEPS.length - 1, Math.floor(percent / 25));
}

/**
 * Progression d'une commande fournisseur — avance sur 2 jours calendaires depuis la date de commande.
 */
export function resolveDemoSupplierOrderProgress(
  statusOrInput: SupplierOrderStatus | string | SupplierOrderProgressInput,
  legacyOptions?: Omit<SupplierOrderProgressInput, "status">
): DemoSupplierOrderProgress {
  const input: SupplierOrderProgressInput =
    typeof statusOrInput === "object" && statusOrInput !== null && "status" in statusOrInput
      ? statusOrInput
      : { status: statusOrInput, ...legacyOptions };

  const status = input.status as SupplierOrderStatus;
  if (status === "cancelled") {
    return { activeIndex: -1, percent: 0, cancelled: true };
  }
  if (status === "delivered" || input.deliveredAt) {
    return { activeIndex: DEMO_SUPPLIER_ORDER_STEPS.length - 1, percent: 100, cancelled: false };
  }

  const orderMs =
    parseSupplierOrderTimestamp(input.sentAt) ?? parseSupplierOrderTimestamp(input.createdAt);
  if (!orderMs) {
    return resolveStatusFallbackProgress(status);
  }

  const now = input.now ?? Date.now();
  const elapsed = Math.max(0, now - orderMs);
  const percent = Math.min(100, Math.round((elapsed / SUPPLIER_ORDER_DELIVERY_MS) * 100));
  const activeIndex = activeIndexFromPercent(percent);

  return { activeIndex, percent, cancelled: false };
}
