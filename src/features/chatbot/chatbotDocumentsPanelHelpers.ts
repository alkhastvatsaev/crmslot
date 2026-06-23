import { documentCreatedAtMs } from "@/features/chatbot/filterChatbotDocuments";
import type { SupplierOrder } from "@/features/suppliers/types";

export function formatEur(cents: number): string {
  return `${(cents / 100).toLocaleString("fr-BE", { maximumFractionDigits: 0 })} €`;
}

export function formatWhen(raw: unknown): string {
  const ms = documentCreatedAtMs(raw);
  if (!ms) return "";
  return new Date(ms).toLocaleDateString("fr-BE", { day: "numeric", month: "short" });
}

export function supplierOrderTitle(order: SupplierOrder): string {
  const lines = order.lines ?? [];
  const first = lines[0]?.label?.trim();
  if (!first) return "Commande";
  if (lines.length === 1) return first;
  return first;
}

export function resolveSelectedKey(preview: {
  kind: string;
  interventionId: string;
  supplierOrderId?: string | null;
  loading: boolean;
  blobUrl: string | null;
  error: string | null;
}): string | null {
  if (!preview.loading && !preview.blobUrl && !preview.error) return null;
  if (preview.kind === "invoice" && preview.interventionId) {
    return `invoice:${preview.interventionId}`;
  }
  if (preview.supplierOrderId) {
    return `supplier:${preview.supplierOrderId}`;
  }
  if (preview.kind === "material_order" && preview.interventionId) {
    return `material:${preview.interventionId}`;
  }
  return null;
}
