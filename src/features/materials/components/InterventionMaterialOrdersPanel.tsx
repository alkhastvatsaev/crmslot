"use client";

import { useCallback, useMemo, useState } from "react";
import { Package, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { auth, firestore } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import MaterialPartSuggestions from "@/features/materials/components/MaterialPartSuggestions";
import { MaterialOrderForm } from "@/features/materials/components/MaterialOrderForm";
import { createMaterialOrder } from "@/features/materials/createMaterialOrder";
import { updateMaterialOrderStatus } from "@/features/materials/materialOrderFirestore";
import { orderInterventionPartViaMaterialAgent } from "@/features/materials/orderInterventionPartViaMaterialAgent";
import { suggestMaterialPartsFromIntervention } from "@/features/materials/suggestMaterialPartsFromIntervention";
import { useMaterialOrders } from "@/features/materials/useMaterialOrders";
import type { MaterialOrder, MaterialOrderPart } from "@/features/materials/types";
import type { Intervention } from "@/features/interventions/types";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { useCompanyStockItems } from "@/features/featureHub/hooks/useCompanyStockItems";
import {
  dispatcherTransitionActor,
  technicianTransitionActor,
} from "@/features/interventions/workflow/workflowActor";

type Props = {
  intervention: Pick<
    Intervention,
    | "id"
    | "status"
    | "companyId"
    | "assignedTechnicianUid"
    | "createdByUid"
    | "title"
    | "problem"
    | "transcription"
    | "category"
    | "clientFirstName"
    | "clientLastName"
    | "clientName"
    | "clientCompanyName"
  >;
  technicianUid: string;
  allowCreate?: boolean;
  allowStatusUpdate?: boolean;
  expanded?: boolean;
  onExpandedChange?: (v: boolean) => void;
  defaultExpanded?: boolean;
  showPartSuggestions?: boolean;
  /** Commande via agent matériel (page Matériel) au clic sur une suggestion. */
  orderSuggestionsViaAgent?: boolean;
  compact?: boolean;
};

const STATUS_KEYS: MaterialOrder["status"][] = ["pending", "ordered", "received", "cancelled"];

export default function InterventionMaterialOrdersPanel({
  intervention,
  technicianUid,
  allowCreate = true,
  allowStatusUpdate = false,
  expanded: controlledExpanded,
  onExpandedChange,
  defaultExpanded = false,
  showPartSuggestions = true,
  orderSuggestionsViaAgent = true,
  compact = false,
}: Props) {
  const { t } = useTranslation();
  const pager = useDashboardPagerOptional();
  const { orders, loading } = useMaterialOrders(intervention.id);
  const { items: stockItems } = useCompanyStockItems(intervention.companyId ?? null);
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const [showForm, setShowForm] = useState(false);
  const [formInitialParts, setFormInitialParts] = useState<MaterialOrderPart[] | undefined>();

  const suggestions = useMemo(() => {
    if (!showPartSuggestions) return [];
    return suggestMaterialPartsFromIntervention(intervention, stockItems);
  }, [intervention, showPartSuggestions, stockItems]);

  const panelExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    if (onExpandedChange) {
      onExpandedChange(!panelExpanded);
    } else {
      setInternalExpanded(!panelExpanded);
    }
  };

  const handleSubmit = useCallback(
    async (parts: MaterialOrderPart[], urgency: MaterialOrder["urgency"]) => {
      if (!firestore) return;
      const uid = auth?.currentUser?.uid?.trim();
      if (!uid) throw new Error("Non connecté");
      await createMaterialOrder({
        db: firestore,
        intervention,
        technicianUid,
        partsRequested: parts,
        urgency,
        actor: allowStatusUpdate ? dispatcherTransitionActor(uid) : technicianTransitionActor(uid),
        setWaitingMaterial: !allowStatusUpdate,
      });
      setShowForm(false);
      setFormInitialParts(undefined);
      if (onExpandedChange) onExpandedChange(true);
      else setInternalExpanded(true);
      toast.success(String(t("materials.order_created")));
    },
    [intervention, technicianUid, allowStatusUpdate, onExpandedChange, t]
  );

  const handleOrderSuggestion = useCallback(
    (part: (typeof suggestions)[number]) => {
      if (orderSuggestionsViaAgent) {
        orderInterventionPartViaMaterialAgent(pager, intervention, part);
        toast.message(String(t("materials.suggestions.opening_agent")));
        return;
      }
      setFormInitialParts([part]);
      setShowForm(true);
    },
    [intervention, orderSuggestionsViaAgent, pager, t]
  );

  const handleStatus = async (orderId: string, status: MaterialOrder["status"]) => {
    if (!firestore) return;
    try {
      await updateMaterialOrderStatus(firestore, orderId, status);
      toast.success(String(t("materials.status_updated")));
    } catch {
      toast.error(String(t("common.error")));
    }
  };

  return (
    <div
      id="technician-material-orders"
      data-testid="intervention-material-orders-panel"
      className={compact ? "space-y-1" : "space-y-2"}
    >
      <button
        type="button"
        data-testid="material-orders-toggle"
        onClick={handleToggle}
        className={
          compact
            ? "flex w-full items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2 transition-colors hover:bg-slate-100/80"
            : "flex w-full items-center justify-between rounded-[14px] border border-slate-100 bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100/80"
        }
      >
        <span
          className={
            compact
              ? "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-700"
              : "flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-slate-700"
          }
        >
          <Package className={compact ? "h-3.5 w-3.5 text-slate-500" : "h-4 w-4 text-slate-500"} />
          {t("materials.panel_title")}
          {orders.length > 0 ? (
            <span className="text-[10px] font-bold text-slate-400">{orders.length}</span>
          ) : null}
        </span>
        {panelExpanded ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {panelExpanded ? (
        <div
          className={
            compact
              ? "space-y-2 rounded-lg border border-slate-100 bg-white p-2"
              : "space-y-3 rounded-[18px] border border-slate-100 bg-white p-4"
          }
        >
          {allowCreate && showPartSuggestions && !showForm && suggestions.length > 0 ? (
            <MaterialPartSuggestions
              suggestions={suggestions}
              stockItems={stockItems}
              onOrderPart={handleOrderSuggestion}
            />
          ) : null}
          {loading && orders.length === 0 ? (
            <p className="text-center text-[12px] text-slate-400">{t("common.loading")}</p>
          ) : null}
          {orders.length === 0 && !loading && !showForm && suggestions.length === 0 ? (
            <p className="text-center text-[12px] text-slate-400">{t("materials.empty")}</p>
          ) : null}
          <ul className="space-y-2" data-testid="material-orders-list">
            {orders.map((order) => (
              <li
                key={order.id}
                data-testid={`material-order-${order.id}`}
                className="rounded-[14px] border border-slate-100 bg-slate-50/80 px-3 py-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase text-slate-500">
                    {t(`materials.status.${order.status}`)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(order.createdAt).toLocaleString("fr-BE", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <ul className="mt-1 space-y-0.5 text-[13px] text-slate-800">
                  {order.partsRequested.map((p, i) => (
                    <li key={i}>
                      {p.quantity}× {p.description}
                      {p.reference ? ` (${p.reference})` : ""}
                    </li>
                  ))}
                </ul>
                {allowStatusUpdate &&
                order.status !== "received" &&
                order.status !== "cancelled" ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {STATUS_KEYS.filter((s) => s !== order.status && s !== "pending").map((s) => (
                      <button
                        key={s}
                        type="button"
                        data-testid={`material-order-status-${order.id}-${s}`}
                        onClick={() => void handleStatus(order.id, s)}
                        className="rounded-[8px] bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
                      >
                        {t(`materials.status.${s}`)}
                      </button>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          {allowCreate && !showForm ? (
            <button
              type="button"
              data-testid="material-order-new"
              onClick={() => {
                setFormInitialParts(undefined);
                setShowForm(true);
              }}
              className="w-full rounded-[12px] py-2.5 text-[12px] font-bold text-blue-600 hover:bg-blue-50"
            >
              {t("materials.new_order")}
            </button>
          ) : null}
          {allowCreate && showForm ? (
            <MaterialOrderForm
              key={formInitialParts?.map((p) => p.description).join("|") ?? "blank"}
              interventionId={intervention.id}
              technicianUid={technicianUid}
              initialParts={formInitialParts}
              onSubmitOrder={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setFormInitialParts(undefined);
              }}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
