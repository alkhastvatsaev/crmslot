"use client";

import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Truck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { firestore } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import { isDemoMaterialOrderId } from "@/features/dev/demoCompanyStock";
import SupplierOrderDemoProgress from "@/features/chatbot/components/SupplierOrderDemoProgress";
import {
  updateMaterialOrderStatus,
  type MaterialOrderDoc,
} from "@/features/materials/materialOrderFirestore";
import { displayMaterialOrderClientName } from "@/features/materials/materialOrderClientName";
import type { MaterialOrder } from "@/features/materials/types";
import { SUPPLIER_ORDER_STATUS_LABELS, type SupplierOrder } from "@/features/suppliers/types";

type Props = {
  orders: MaterialOrderDoc[];
  supplierOrders: SupplierOrder[];
  loading: boolean;
  onDismissDemoOrder?: (orderId: string) => void;
};

function parseOrderMs(raw: unknown): number {
  if (!raw) return 0;
  if (typeof raw === "object" && raw !== null && "seconds" in raw) {
    return (raw as { seconds: number }).seconds * 1000;
  }
  const t = Date.parse(String(raw));
  return Number.isFinite(t) ? t : 0;
}

function formatWhenShort(raw: unknown): string {
  const ms = parseOrderMs(raw);
  if (!ms) return "";
  return new Date(ms).toLocaleDateString("fr-BE", { day: "numeric", month: "short" });
}

function isOpenSupplierOrder(order: SupplierOrder): boolean {
  return order.status === "draft" || order.status === "sent" || order.status === "confirmed";
}

const MATERIAL_STATUS_KEYS: Record<string, string> = {
  pending: "companyStock.order_status_pending",
  approved: "companyStock.order_status_approved",
  ordered: "companyStock.order_status_ordered",
  delivered: "companyStock.order_status_delivered",
  received: "companyStock.order_status_received",
  cancelled: "companyStock.order_status_cancelled",
};

export default function CompanyStockOrdersTrackPanel({
  orders,
  supplierOrders,
  loading,
  onDismissDemoOrder,
}: Props) {
  const { t } = useTranslation();
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const pendingField = useMemo(
    () =>
      [...orders]
        .filter((o) => o.status === "pending")
        .sort((a, b) => parseOrderMs(b.createdAt) - parseOrderMs(a.createdAt)),
    [orders]
  );

  const openSupplier = useMemo(
    () =>
      [...supplierOrders]
        .filter(isOpenSupplierOrder)
        .sort((a, b) => parseOrderMs(b.createdAt) - parseOrderMs(a.createdAt)),
    [supplierOrders]
  );

  const handleApprove = useCallback(
    async (orderId: string) => {
      setApprovingId(orderId);
      try {
        if (isDemoMaterialOrderId(orderId)) {
          onDismissDemoOrder?.(orderId);
        } else if (firestore) {
          await updateMaterialOrderStatus(firestore, orderId, "ordered" as MaterialOrder["status"]);
        }
        toast.success(String(t("companyStock.order_approved")));
      } catch {
        toast.error(String(t("common.error")));
      } finally {
        setApprovingId(null);
      }
    },
    [onDismissDemoOrder, t]
  );

  if (loading) {
    return (
      <div
        data-testid="company-stock-orders-track"
        className="flex min-h-0 flex-1 items-center justify-center bg-white"
      >
        <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div
      data-testid="company-stock-orders-track"
      className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-hidden bg-white"
    >
      <header className="shrink-0 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-slate-500" aria-hidden />
          <h2 className="text-[13px] font-semibold tracking-tight text-slate-900">
            {t("companyStock.orders_track_title")}
          </h2>
        </div>
      </header>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <section data-testid="company-stock-track-field" className="mb-4">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {t("companyStock.rail_field_heading")}
          </h3>
          {pendingField.length === 0 ? (
            <p
              className="rounded-[12px] border border-dashed border-slate-200/90 px-3 py-4 text-center text-[11px] text-slate-400"
              data-testid="company-stock-track-field-empty"
            >
              {t("companyStock.rail_field_empty")}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {pendingField.map((order) => {
                const statusKey =
                  MATERIAL_STATUS_KEYS[order.status] ?? MATERIAL_STATUS_KEYS.pending;
                return (
                  <li
                    key={order.id}
                    data-testid={`company-stock-field-order-${order.id}`}
                    className="rounded-[12px] border border-slate-200/80 bg-slate-50/50 px-3 py-2.5"
                  >
                    <p className="truncate text-[12px] font-medium text-slate-900">
                      {displayMaterialOrderClientName(order)}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-400">
                      {order.interventionId}
                      {formatWhenShort(order.createdAt)
                        ? ` · ${formatWhenShort(order.createdAt)}`
                        : ""}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        {t(statusKey)}
                      </span>
                      <button
                        type="button"
                        data-testid={`company-stock-approve-order-${order.id}`}
                        disabled={approvingId === order.id}
                        onClick={() => void handleApprove(order.id)}
                        className="inline-flex items-center gap-1 rounded-[10px] bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        {approvingId === order.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                        ) : (
                          <CheckCircle2 className="h-3 w-3" aria-hidden />
                        )}
                        {t("companyStock.approve_order")}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section data-testid="company-stock-track-supplier">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {t("companyStock.rail_supplier_heading")}
          </h3>
          {openSupplier.length === 0 ? (
            <p
              className="rounded-[12px] border border-dashed border-slate-200/90 px-3 py-4 text-center text-[11px] text-slate-400"
              data-testid="company-stock-track-supplier-empty"
            >
              {t("companyStock.rail_supplier_empty")}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {openSupplier.map((order) => (
                <li
                  key={order.id}
                  data-testid={`company-stock-supplier-order-${order.id}`}
                  className="rounded-[12px] border border-slate-200/80 bg-white px-3 py-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-[12px] font-medium text-slate-900">
                      {displayMaterialOrderClientName({
                        clientName: order.clientName,
                        interventionId: order.interventionId ?? "",
                      })}
                    </p>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        order.status === "confirmed"
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-blue-50 text-blue-700"
                      )}
                    >
                      {SUPPLIER_ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {order.supplierName}
                    {formatWhenShort(order.createdAt)
                      ? ` · ${formatWhenShort(order.createdAt)}`
                      : ""}
                  </p>
                  <SupplierOrderDemoProgress
                    orderId={order.id}
                    status={order.status}
                    createdAt={order.createdAt}
                    sentAt={order.sentAt}
                    deliveredAt={order.deliveredAt}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
