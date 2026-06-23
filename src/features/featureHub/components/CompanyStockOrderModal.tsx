"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { StockItem } from "@/features/materials";

type Props = {
  item: StockItem | null;
  imageUrl?: string | null;
  onClose: () => void;
  onConfirm: (qty: number) => void;
};

export default function CompanyStockOrderModal({ item, imageUrl, onClose, onConfirm }: Props) {
  const [qty, setQty] = useState(1);

  function handleConfirm() {
    if (!item) return;
    onConfirm(qty);
    onClose();
  }

  return (
    <AnimatePresence>
      {item ? (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
          <motion.div
            key="panel"
            className="relative z-10 mx-4 w-full max-w-[320px] overflow-hidden rounded-[20px] bg-white shadow-[0_20px_60px_-12px_rgba(15,23,42,0.25)]"
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Product header */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-[10px] object-contain"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-slate-100">
                  <span className="text-[20px]">📦</span>
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-900">
                  {item.description}
                </p>
                {item.reference ? (
                  <p className="mt-0.5 text-[11px] text-slate-400">réf. {item.reference}</p>
                ) : null}
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between px-5 py-5">
              <span className="text-[13px] font-medium text-slate-700">Quantité</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-[16px] font-medium transition",
                    qty <= 1 ? "text-slate-300" : "text-slate-700 hover:bg-slate-100"
                  )}
                  disabled={qty <= 1}
                  aria-label="Diminuer la quantité"
                >
                  −
                </button>
                <span className="w-6 text-center text-[16px] font-semibold tabular-nums text-slate-900">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-[16px] font-medium text-slate-700 transition hover:bg-slate-100"
                  aria-label="Augmenter la quantité"
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-[12px] border border-slate-200 py-2.5 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 rounded-[12px] bg-slate-900 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-700"
              >
                Commander →
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
