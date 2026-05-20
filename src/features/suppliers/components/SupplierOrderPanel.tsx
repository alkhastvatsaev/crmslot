"use client";

import { useEffect, useState } from "react";
import { Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { firestore } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import {
  subscribeSupplierOrders,
  createSupplierOrder,
  updateSupplierOrderStatus,
} from "../supplierFirestore";
import SupplierOrderCard from "./SupplierOrderCard";
import type { SupplierOrder, SupplierOrderLine, SupplierOrderStatus } from "../types";

export default function SupplierOrderPanel() {
  const { t } = useTranslation();
  const enabled = useFeatureFlag("supplierPortal");
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";

  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const [supplierName, setSupplierName] = useState("Lecot");
  const [lines, setLines] = useState<SupplierOrderLine[]>([
    { sku: "", label: "", quantity: 1, unitPriceCents: 0 },
  ]);

  useEffect(() => {
    if (!enabled || !firestore || !companyId) return;
    return subscribeSupplierOrders(firestore, companyId, setOrders);
  }, [enabled, companyId]);

  const addLine = () =>
    setLines((prev) => [...prev, { sku: "", label: "", quantity: 1, unitPriceCents: 0 }]);

  const updateLine = (i: number, patch: Partial<SupplierOrderLine>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !companyId) return;
    const validLines = lines.filter((l) => l.sku.trim() && l.label.trim());
    if (validLines.length === 0) {
      toast.error(String(t("suppliers.error_no_lines")));
      return;
    }
    setBusy(true);
    try {
      await createSupplierOrder(firestore, companyId, {
        supplierId: "lecot",
        supplierName: supplierName.trim() || "Lecot",
        lines: validLines,
        deliveryDate: null,
        notes: null,
        createdByUid: workspace?.firebaseUid ?? null,
      });
      setLines([{ sku: "", label: "", quantity: 1, unitPriceCents: 0 }]);
      setShowForm(false);
      toast.success(String(t("suppliers.toast_created")));
    } catch {
      toast.error(String(t("common.error")));
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: SupplierOrderStatus) => {
    if (!firestore) return;
    try {
      await updateSupplierOrderStatus(firestore, companyId, id, status);
    } catch {
      toast.error(String(t("common.error")));
    }
  };

  if (!enabled) return null;

  return (
    <section data-testid="supplier-order-panel" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">{t("suppliers.panel_title")}</h3>
        </div>
        <button
          type="button"
          data-testid="supplier-new-order"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("suppliers.new_order")}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => void handleCreate(e)}
          data-testid="supplier-order-form"
          className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
        >
          <input
            data-testid="supplier-name"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="Fournisseur"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <div className="space-y-2">
            {lines.map((line, i) => (
              <div key={i} className="grid grid-cols-[80px_1fr_50px_80px] gap-1">
                <input
                  data-testid={`supplier-line-sku-${i}`}
                  value={line.sku}
                  onChange={(e) => updateLine(i, { sku: e.target.value })}
                  placeholder="SKU"
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                />
                <input
                  data-testid={`supplier-line-label-${i}`}
                  value={line.label}
                  onChange={(e) => updateLine(i, { label: e.target.value })}
                  placeholder="Article"
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                />
                <input
                  data-testid={`supplier-line-qty-${i}`}
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) => updateLine(i, { quantity: Math.max(1, Number(e.target.value)) })}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-right"
                />
                <input
                  data-testid={`supplier-line-price-${i}`}
                  type="number"
                  min={0}
                  step={0.01}
                  value={(line.unitPriceCents / 100).toFixed(2)}
                  onChange={(e) =>
                    updateLine(i, { unitPriceCents: Math.round(Number(e.target.value) * 100) })
                  }
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-right"
                />
              </div>
            ))}
          </div>
          <button type="button" onClick={addLine} className="text-xs font-semibold text-blue-600 hover:underline">
            + {t("suppliers.add_line")}
          </button>
          <button
            type="submit"
            disabled={busy}
            data-testid="supplier-order-submit"
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {t("suppliers.create")}
          </button>
        </form>
      )}

      {orders.length === 0 ? (
        <p className="text-sm text-slate-400">{t("suppliers.empty")}</p>
      ) : (
        <ul className="space-y-2">
          {orders.map((o) => (
            <li key={o.id}>
              <SupplierOrderCard
                order={o}
                onUpdateStatus={(id, status) => void handleUpdateStatus(id, status)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
