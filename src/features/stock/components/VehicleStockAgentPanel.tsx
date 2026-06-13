"use client";

import { useEffect, useState } from "react";
import { Package, Truck } from "lucide-react";
import { firestore } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import HubAgentPanel from "@/features/hubAgents/HubAgentPanel";
import { useVehicleStockAgent } from "@/features/stock/hooks/useVehicleStockAgent";
import { subscribeStockItems } from "@/features/stock/stockFirestore";
import StockAlertBadge from "@/features/stock/components/StockAlertBadge";
import { isStockLow } from "@/features/stock/types";
import type { StockItem } from "@/features/stock/types";

type Props = {
  techUid?: string;
  pageActive?: boolean;
};

export default function VehicleStockAgentPanel({ techUid, pageActive = true }: Props) {
  const { t } = useTranslation();
  const enabled = useFeatureFlag("vehicleStock");
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const uid = techUid ?? workspace?.firebaseUid ?? "";

  const [items, setItems] = useState<StockItem[]>([]);

  useEffect(() => {
    if (!enabled || !firestore || !companyId || !uid) return;
    return subscribeStockItems(firestore, companyId, uid, setItems);
  }, [enabled, companyId, uid]);

  const agent = useVehicleStockAgent({ enabled: enabled && Boolean(companyId) && pageActive });

  if (!enabled) return null;

  return (
    <section data-testid="vehicle-stock-agent-panel" className="flex min-h-0 flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <Truck className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-bold text-slate-900">{t("stock.panel_title")}</h3>
        <StockAlertBadge items={items} />
      </div>

      <HubAgentPanel
        testIdPrefix="vehicle-stock-agent"
        thinkingLabelKey="stock.agent_thinking"
        agent={agent}
        pageActive={pageActive}
        enabled={Boolean(companyId)}
        registerHandlers={() => {}}
      />

      {items.length > 0 && (
        <ul className="space-y-1.5 overflow-y-auto pb-1 custom-scrollbar">
          {items.map((item) => (
            <li
              key={item.id}
              data-testid={`stock-item-${item.id}`}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                isStockLow(item) ? "border-red-200 bg-red-50" : "border-slate-100 bg-white"
              }`}
            >
              <Package
                className={`h-4 w-4 shrink-0 ${isStockLow(item) ? "text-red-400" : "text-slate-400"}`}
              />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-slate-500">{item.sku}</p>
              </div>
              <span
                className={`w-8 text-center text-sm font-bold tabular-nums ${
                  isStockLow(item) ? "text-red-600" : "text-slate-900"
                }`}
              >
                {item.quantity}
              </span>
            </li>
          ))}
        </ul>
      )}

      {items.length === 0 && <p className="text-xs text-slate-400 px-1">{t("stock.empty")}</p>}
    </section>
  );
}
