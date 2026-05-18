"use client";

import { useEffect, useState } from "react";
import { Plus, Minus, Package, Truck } from "lucide-react";
import { toast } from "sonner";
import { firestore } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import {
  subscribeStockItems,
  createStockItem,
  updateStockQuantity,
} from "../stockFirestore";
import StockAlertBadge from "./StockAlertBadge";
import type { StockItem } from "../types";
import { isStockLow } from "../types";

function formatEur(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

export default function VehicleStockPanel({ techUid }: { techUid?: string }) {
  const { t } = useTranslation();
  const enabled = useFeatureFlag("vehicleStock");
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const uid = techUid ?? workspace?.firebaseUid ?? "";

  const [items, setItems] = useState<StockItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sku, setSku] = useState("");
  const [label, setLabel] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [minQuantity, setMinQuantity] = useState(1);
  const [priceEuros, setPriceEuros] = useState("0");

  useEffect(() => {
    if (!enabled || !firestore || !companyId || !uid) return;
    return subscribeStockItems(firestore, companyId, uid, setItems);
  }, [enabled, companyId, uid]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !companyId || !uid) return;
    if (!sku.trim() || !label.trim()) {
      toast.error(String(t("stock.error_fields_required")));
      return;
    }
    setBusy(true);
    try {
      await createStockItem(firestore, companyId, uid, {
        sku: sku.trim(),
        label: label.trim(),
        quantity,
        minQuantity,
        unitPriceCents: Math.round(Number(priceEuros.replace(",", ".")) * 100),
      });
      setSku(""); setLabel(""); setQuantity(1); setMinQuantity(1); setPriceEuros("0");
      setShowForm(false);
      toast.success(String(t("stock.toast_added")));
    } catch {
      toast.error(String(t("common.error")));
    } finally {
      setBusy(false);
    }
  };

  const handleDelta = async (item: StockItem, delta: number) => {
    if (!firestore) return;
    try {
      await updateStockQuantity(firestore, companyId, uid, item.id, delta);
    } catch {
      toast.error(String(t("common.error")));
    }
  };

  if (!enabled) return null;

  return (
    <section data-testid="vehicle-stock-panel" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">{t("stock.panel_title")}</h3>
          <StockAlertBadge items={items} />
        </div>
        <button
          type="button"
          data-testid="stock-add-btn"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-slate-700"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("stock.add")}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => void handleAdd(e)}
          data-testid="stock-form"
          className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2"
        >
          <input data-testid="stock-sku" value={sku} onChange={(e) => setSku(e.target.value)}
            placeholder="SKU" className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
          <input data-testid="stock-label" value={label} onChange={(e) => setLabel(e.target.value)}
            placeholder={String(t("stock.label_placeholder"))} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
          <input data-testid="stock-qty" type="number" min={0} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}
            placeholder={String(t("stock.qty"))} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
          <input data-testid="stock-min-qty" type="number" min={0} value={minQuantity} onChange={(e) => setMinQuantity(Number(e.target.value))}
            placeholder={String(t("stock.min_qty"))} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
          <input data-testid="stock-price" value={priceEuros} onChange={(e) => setPriceEuros(e.target.value)}
            placeholder="Prix HT (€)" inputMode="decimal" className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm sm:col-span-2" />
          <button type="submit" disabled={busy} data-testid="stock-submit"
            className="rounded-lg bg-slate-900 py-2 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2">
            {t("stock.create")}
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-slate-400">{t("stock.empty")}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              data-testid={`stock-item-${item.id}`}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${isStockLow(item) ? "border-red-200 bg-red-50" : "border-slate-100 bg-white"}`}
            >
              <Package className={`h-4 w-4 shrink-0 ${isStockLow(item) ? "text-red-400" : "text-slate-400"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{item.label}</p>
                <p className="text-xs text-slate-500">{item.sku} · {formatEur(item.unitPriceCents)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" data-testid={`stock-decrement-${item.id}`}
                  onClick={() => void handleDelta(item, -1)}
                  className="rounded-lg border border-slate-200 p-1 hover:bg-slate-100">
                  <Minus className="h-3 w-3" />
                </button>
                <span className={`w-8 text-center text-sm font-bold tabular-nums ${isStockLow(item) ? "text-red-600" : "text-slate-900"}`}>
                  {item.quantity}
                </span>
                <button type="button" data-testid={`stock-increment-${item.id}`}
                  onClick={() => void handleDelta(item, 1)}
                  className="rounded-lg border border-slate-200 p-1 hover:bg-slate-100">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
