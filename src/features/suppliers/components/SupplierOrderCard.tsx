"use client";

import { Package, Truck, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPPLIER_ORDER_STATUS_LABELS, type SupplierOrder, type SupplierOrderStatus } from "../types";

const STATUS_STYLES: Record<SupplierOrderStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-100 text-blue-700",
  confirmed: "bg-amber-100 text-amber-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
};

const STATUS_ICONS: Record<SupplierOrderStatus, React.ElementType> = {
  draft: Package,
  sent: Truck,
  confirmed: Truck,
  delivered: CheckCircle,
  cancelled: Package,
};

function formatEur(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-BE", { day: "2-digit", month: "short", year: "numeric" });
}

type Props = {
  order: SupplierOrder;
  onUpdateStatus: (id: string, status: SupplierOrderStatus) => void;
};

export default function SupplierOrderCard({ order, onUpdateStatus }: Props) {
  const Icon = STATUS_ICONS[order.status];

  return (
    <div
      data-testid={`supplier-order-card-${order.id}`}
      className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-bold text-slate-900">{order.supplierName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", STATUS_STYLES[order.status])}>
            {SUPPLIER_ORDER_STATUS_LABELS[order.status]}
          </span>
          <span className="text-sm font-bold text-blue-700">{formatEur(order.totalCents)}</span>
        </div>
      </div>

      <ul className="text-xs text-slate-600 space-y-0.5">
        {order.lines.map((l, i) => (
          <li key={i} className="flex justify-between">
            <span className="truncate">{l.label} <span className="text-slate-400">({l.sku})</span></span>
            <span className="ml-2 shrink-0">{l.quantity} × {formatEur(l.unitPriceCents)}</span>
          </li>
        ))}
      </ul>

      {order.deliveryDate && (
        <p className="text-xs text-slate-400">Livraison prévue : {formatDate(order.deliveryDate)}</p>
      )}

      {order.status === "draft" && (
        <button
          type="button"
          data-testid={`supplier-order-send-${order.id}`}
          onClick={() => onUpdateStatus(order.id, "sent")}
          className="w-full rounded-lg bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700"
        >
          Envoyer la commande
        </button>
      )}
      {order.status === "sent" && (
        <button
          type="button"
          data-testid={`supplier-order-confirm-${order.id}`}
          onClick={() => onUpdateStatus(order.id, "confirmed")}
          className="w-full rounded-lg bg-amber-500 py-2 text-xs font-bold text-white hover:bg-amber-600"
        >
          Marquer comme confirmé
        </button>
      )}
      {order.status === "confirmed" && (
        <button
          type="button"
          data-testid={`supplier-order-deliver-${order.id}`}
          onClick={() => onUpdateStatus(order.id, "delivered")}
          className="w-full rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700"
        >
          Marquer comme livré
        </button>
      )}
    </div>
  );
}
