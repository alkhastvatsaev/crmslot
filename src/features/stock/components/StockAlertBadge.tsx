"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StockItem } from "../types";
import { isStockLow } from "../types";

type Props = {
  items: StockItem[];
  className?: string;
};

export default function StockAlertBadge({ items, className }: Props) {
  const lowCount = items.filter(isStockLow).length;
  if (lowCount === 0) return null;

  return (
    <span
      data-testid="stock-alert-badge"
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white",
        className,
      )}
    >
      <AlertTriangle className="h-3 w-3" />
      {lowCount} rupture{lowCount > 1 ? "s" : ""}
    </span>
  );
}
