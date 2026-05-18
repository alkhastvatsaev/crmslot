"use client";

import { useEffect, useState } from "react";
import { Plus, AlertTriangle, Minus, PackageCheck } from "lucide-react";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import {
  subscribeStockItems,
  createStockItem,
  adjustStockQuantity,
  type StockItem,
} from "@/features/materials/stockFirestore";
import { cn } from "@/lib/utils";

export default function StockManagementPanel() {
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId ?? "";

  const [items, setItems] = useState<StockItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ reference: "", description: "", quantity: 0, alertThreshold: 5, unit: "pcs" });

  useEffect(() => {
    if (!companyId) return;
    return subscribeStockItems(companyId, setItems);
  }, [companyId]);

  const handleCreate = async () => {
    if (!form.description) return;
    await createStockItem({ ...form, companyId });
    setForm({ reference: "", description: "", quantity: 0, alertThreshold: 5, unit: "pcs" });
    setShowForm(false);
  };

  const lowStock = items.filter((i) => i.quantity <= i.alertThreshold);

  return (
    <div data-testid="stock-management-panel" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-slate-800">Stock matériaux</h3>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-xl bg-black px-3 py-1.5 text-[12px] font-bold text-white hover:bg-black/80"
        >
          <Plus className="h-3.5 w-3.5" /> Ajouter
        </button>
      </div>

      {lowStock.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span className="text-[12px] font-bold text-amber-800">
            {lowStock.length} article{lowStock.length > 1 ? "s" : ""} en stock faible
          </span>
        </div>
      )}

      {showForm && (
        <div className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-[#FAFAFA] p-4">
          <div className="flex gap-2">
            <input
              placeholder="Référence"
              value={form.reference}
              onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
              className="w-28 rounded-xl border border-black/8 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-black/10"
            />
            <input
              placeholder="Description *"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="flex-1 rounded-xl border border-black/8 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Qté"
              min={0}
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
              className="w-20 rounded-xl border border-black/8 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-black/10"
            />
            <input
              type="number"
              placeholder="Seuil alerte"
              min={0}
              value={form.alertThreshold}
              onChange={(e) => setForm((f) => ({ ...f, alertThreshold: Number(e.target.value) }))}
              className="w-28 rounded-xl border border-black/8 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-black/10"
            />
            <input
              placeholder="Unité"
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              className="w-20 rounded-xl border border-black/8 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!form.description}
            className="w-full rounded-xl bg-black py-2 text-[13px] font-bold text-white disabled:opacity-40"
          >
            Créer l&apos;article
          </button>
        </div>
      )}

      {items.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <PackageCheck className="mb-2 h-8 w-8 text-slate-300" />
          <p className="text-[13px] font-medium text-slate-500">Aucun article en stock</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const low = item.quantity <= item.alertThreshold;
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3",
                low ? "border-amber-200 bg-amber-50" : "border-black/5 bg-white",
              )}
            >
              <div className="flex min-w-0 flex-col">
                <div className="flex items-center gap-2">
                  {item.reference && (
                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                      {item.reference}
                    </span>
                  )}
                  <span className="truncate text-[13px] font-bold text-slate-800">{item.description}</span>
                </div>
                <span className={cn("mt-0.5 text-[11px] font-semibold", low ? "text-amber-700" : "text-slate-500")}>
                  {item.quantity} {item.unit} {low && `⚠ seuil: ${item.alertThreshold}`}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => adjustStockQuantity(item.id, -1)}
                  disabled={item.quantity <= 0}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:opacity-30"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center text-[13px] font-bold tabular-nums">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => adjustStockQuantity(item.id, 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
