"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { isPreviewOverlayForTarget } from "@/features/chatbot/chatbot-document-preview-ui";
import {
  buildInterventionClientLabelMap,
  buildSupplierOrderInterventionIdByOrderId,
  resolveSupplierOrderClientLabel,
} from "@/features/chatbot/chatbotOrderClientLabels";
import ChatbotPdfPreviewOverlay from "@/features/chatbot/components/ChatbotPdfPreviewOverlay";
import { useChatbotContext } from "@/features/chatbot/ChatbotContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import type { SupplierOrder } from "@/features/suppliers/types";
import type { MaterialOrderDoc } from "@/features/materials/materialOrderFirestore";
import SupplierOrderDemoProgress from "@/features/chatbot/components/SupplierOrderDemoProgress";
import { capitalizeName } from "@/utils/stringUtils";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

/** Accent unique du panneau — bleu, sobre. */
const ACCENT = {
  wash: "from-blue-50/70 via-blue-50/20 to-transparent",
  bar: "bg-blue-300/90 group-hover:bg-blue-400",
  barActive: "bg-blue-500",
  rowHighlight: "border-l-blue-500 bg-blue-50/55",
  price: "text-blue-700",
  refresh: "text-blue-500 hover:bg-blue-100/80 hover:text-blue-700",
  count: "text-blue-600/70",
  demo: "text-blue-600",
} as const;

function formatEur(cents: number): string {
  return `${(cents / 100).toLocaleString("fr-BE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

function formatWhenShort(raw: unknown): string {
  if (!raw) return "";
  let ms = 0;
  if (typeof raw === "object" && raw !== null && "seconds" in raw) {
    ms = (raw as { seconds: number }).seconds * 1000;
  } else {
    const t = Date.parse(String(raw));
    if (!Number.isFinite(t)) return "";
    ms = t;
  }
  return new Date(ms).toLocaleDateString("fr-BE", { day: "numeric", month: "short" });
}

function orderTitle(order: SupplierOrder): string {
  const lines = order.lines ?? [];
  const first = lines[0]?.label?.trim();
  if (!first) return "Commande";
  if (lines.length === 1) return first;
  return `${first} · ${lines.length} articles`;
}

function OrderClientLine({ clientLabel }: { clientLabel: string | null }) {
  if (!clientLabel) return null;
  return (
    <p
      className="mt-0.5 truncate text-[12px] font-semibold text-slate-700"
      data-testid="chatbot-order-client-label"
    >
      {capitalizeName(clientLabel)}
    </p>
  );
}

function OrderDateLine({ createdAt }: { createdAt: unknown }) {
  const date = formatWhenShort(createdAt);
  if (!date) return null;
  return <p className="mt-0.5 truncate text-[11px] text-slate-400">{date}</p>;
}

function materialTitle(order: MaterialOrderDoc): string {
  const parts = order.partsRequested ?? [];
  const first = parts[0]?.description?.trim();
  if (!first) return "Bon matériel";
  if (parts.length === 1) return first;
  return `${first} · ${parts.length} lignes`;
}

import type { SupplierOrderStatus } from "@/features/suppliers/types";

function getDemoOrderStatus(orderId: string, originalStatus: string): SupplierOrderStatus {
  if (originalStatus !== "sent") return originalStatus as SupplierOrderStatus;
  let hash = 0;
  for (let i = 0; i < orderId.length; i++) {
    hash = orderId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % 4;
  const statuses: SupplierOrderStatus[] = ["draft", "sent", "confirmed", "delivered"];
  return statuses[index] ?? "sent";
}

function SupplierOrderRow({
  order,
  clientLabel,
  highlighted,
  onViewPdf,
}: {
  order: SupplierOrder;
  clientLabel: string | null;
  highlighted: boolean;
  onViewPdf: () => void;
}) {
  const displayOrder = order.isDemo
    ? { ...order, status: getDemoOrderStatus(order.id, order.status) }
    : order;

  return (
    <article
      data-testid={`chatbot-supplier-order-${displayOrder.id}`}
      className={cn(
        "group flex border-b border-blue-100/50 py-3 pl-1 pr-1 transition-colors last:border-b-0",
        highlighted && cn("border-l-2", ACCENT.rowHighlight),
      )}
    >
      <div className="flex w-full items-start gap-2.5">
        <span
          className={cn(
            "mt-0.5 h-8 w-1 shrink-0 rounded-full transition-colors",
            highlighted ? ACCENT.barActive : ACCENT.bar,
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1 flex flex-col">
          <div className="flex justify-between items-start">
            <button
              type="button"
              className="text-left min-w-0 flex-1"
              onClick={onViewPdf}
              data-testid={`chatbot-supplier-order-pdf-${displayOrder.id}`}
              aria-label="Voir le bon de commande"
            >
              <p className="truncate text-[13px] font-medium leading-snug text-slate-900">
                {orderTitle(displayOrder)}
              </p>
              <OrderClientLine clientLabel={clientLabel} />
              <OrderDateLine createdAt={displayOrder.createdAt} />
            </button>
            <p className={cn("shrink-0 text-[13px] font-semibold tabular-nums ml-2", ACCENT.price)}>
              {formatEur(displayOrder.totalCents)}
            </p>
          </div>

          {displayOrder.isDemo ? (
            <SupplierOrderDemoProgress orderId={displayOrder.id} status={displayOrder.status} />
          ) : null}
        </div>
      </div>
    </article>
  );
}

function MaterialOrderRow({
  order,
  clientLabel,
  highlighted,
  onViewPdf,
}: {
  order: MaterialOrderDoc;
  clientLabel: string | null;
  highlighted: boolean;
  onViewPdf?: () => void;
}) {
  const date = formatWhenShort(order.createdAt);

  return (
    <article
      data-testid={`chatbot-material-order-${order.id}`}
      className={cn(
        "group flex items-center gap-2 border-b border-slate-100/90 py-3 pl-2 pr-1 transition-colors last:border-b-0",
        highlighted ? "border-l-2 border-l-slate-900 bg-slate-50/90" : "border-l-2 border-l-transparent",
        !onViewPdf && "opacity-80",
      )}
    >
      {onViewPdf ? (
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={onViewPdf}
          data-testid={`chatbot-material-order-pdf-${order.id}`}
          aria-label="Voir le bon matériel"
        >
          <p className="truncate text-[13px] font-medium leading-snug text-slate-900">
            {materialTitle(order)}
          </p>
          <OrderClientLine clientLabel={clientLabel} />
          {date ? <p className="mt-0.5 truncate text-[11px] text-slate-400">{date}</p> : null}
        </button>
      ) : (
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium leading-snug text-slate-900">
            {materialTitle(order)}
          </p>
          <OrderClientLine clientLabel={clientLabel} />
          {date ? <p className="mt-0.5 truncate text-[11px] text-slate-400">{date}</p> : null}
        </div>
      )}
    </article>
  );
}

type ChatbotSupplierOrdersPanelProps = {
  placement?: "leftRail" | "rightRail" | "embedded";
};

/** Liste commandes — présentation minimaliste. */
export default function ChatbotSupplierOrdersPanel({
  placement = "embedded",
}: ChatbotSupplierOrdersPanelProps) {
  const {
    companyId,
    supplierOrdersPanel,
    supplierOrders,
    materialOrders,
    registryError,
    closeSupplierOrdersPanel,
    openSupplierOrderPdf,
    openDocumentPreview,
    ensureRightPanelOpen,
    documentPreview,
    closeDocumentPreview,
    refreshRegistry,
    chatbotInvoices,
    workspaceSnapshot,
  } = useChatbotContext();

  const workspace = useCompanyWorkspaceOptional();
  const interventionsCompanyId =
    (workspace?.isTenantUser ? workspace.activeCompanyId : null) ?? companyId;
  const { interventions } = useBackOfficeInterventions(interventionsCompanyId);

  const clientLabelByInterventionId = useMemo(
    () => buildInterventionClientLabelMap(chatbotInvoices, workspaceSnapshot, interventions),
    [chatbotInvoices, workspaceSnapshot, interventions],
  );

  const orderInterventionIdByOrderId = useMemo(
    () => buildSupplierOrderInterventionIdByOrderId(supplierOrders, materialOrders),
    [supplierOrders, materialOrders],
  );

  const isLeftRail = placement === "leftRail";
  const isRightRail = placement === "rightRail";
  const isSideRail = isLeftRail || isRightRail;
  const pdfOverlayTarget = isLeftRail ? "left" : isRightRail ? "materialRight" : "right";
  const highlightId = supplierOrdersPanel.highlightOrderId;
  const highlightMaterialId = supplierOrdersPanel.highlightMaterialOrderId;
  const totalCount = supplierOrders.length + materialOrders.length;
  const previewOnSideRail =
    isSideRail && isPreviewOverlayForTarget(documentPreview, pdfOverlayTarget);

  const isSupplierHighlighted = (orderId: string) =>
    isSideRail ? documentPreview.supplierOrderId === orderId : orderId === highlightId;

  const isMaterialHighlighted = (orderId: string) =>
    isSideRail
      ? highlightMaterialId === orderId && documentPreview.kind === "material_order"
      : orderId === highlightMaterialId;

  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-1 flex-col overflow-hidden",
        !isSideRail && "bg-gradient-to-b from-blue-50/50 to-slate-50/90",
      )}
      data-testid={
        isLeftRail
          ? "chatbot-orders-left-panel"
          : isRightRail
            ? "company-stock-orders-panel"
            : "chatbot-supplier-orders-panel"
      }
      style={isSideRail ? outfit : undefined}
    >
      {isSideRail ? (
        <div className="shrink-0 px-4 pt-4 pb-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[13px] font-medium tracking-[-0.02em] text-slate-800">Commandes</h2>
            {totalCount > 0 ? (
              <span className="text-[10px] tabular-nums text-slate-400">{totalCount}</span>
            ) : null}
          </div>
        </div>
      ) : (
        <header className="flex shrink-0 items-center justify-between border-b border-blue-100/50 px-4 pb-2.5 pt-3">
          <div>
            <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-slate-900">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", ACCENT.barActive)} aria-hidden />
              Commandes & bons
            </h2>
          </div>
          <button
            type="button"
            data-testid="chatbot-supplier-orders-close"
            onClick={closeSupplierOrdersPanel}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Fermer"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </header>
      )}

      <div
        className={cn(
          "custom-scrollbar min-h-0 flex-1 overflow-y-auto",
          isSideRail ? "px-3 pb-4" : "px-2 pb-4",
        )}
        data-testid="chatbot-orders-list"
      >
        {registryError ? (
          <p
            className="mx-2 mb-2 rounded-md bg-amber-50/80 px-2.5 py-2 text-[11px] leading-snug text-amber-900/90"
            data-testid="chatbot-registry-error"
          >
            {registryError}
          </p>
        ) : null}

        <section data-testid="chatbot-supplier-orders-section">
          {supplierOrders.length === 0 && materialOrders.length === 0 ? (
            <p
              className="px-3 py-8 text-center text-[12px] leading-relaxed text-slate-400"
              data-testid="chatbot-supplier-orders-empty"
            >
              Aucune commande pour le moment.
            </p>
          ) : null}
          {supplierOrders.slice(0, 15).map((order) => (
            <SupplierOrderRow
              key={order.id}
              order={order}
              clientLabel={resolveSupplierOrderClientLabel(
                order.id,
                order.interventionId,
                orderInterventionIdByOrderId,
                clientLabelByInterventionId,
              )}
              highlighted={isSupplierHighlighted(order.id)}
              onViewPdf={() => {
                if (!companyId) return;
                if (isSideRail) {
                  void openSupplierOrderPdf(companyId, order.id, false, pdfOverlayTarget);
                } else {
                  ensureRightPanelOpen();
                  void openSupplierOrderPdf(companyId, order.id);
                }
              }}
            />
          ))}
        </section>

        {materialOrders.length > 0 ? (
          <section
            data-testid="chatbot-material-orders-section"
            className={cn(supplierOrders.length > 0 && "mt-1 border-t border-blue-100/60")}
          >
            {materialOrders.map((order) => (
              <MaterialOrderRow
                key={order.id}
                order={order}
                clientLabel={resolveSupplierOrderClientLabel(
                  order.id,
                  order.interventionId,
                  orderInterventionIdByOrderId,
                  clientLabelByInterventionId,
                )}
                highlighted={isMaterialHighlighted(order.id)}
                onViewPdf={
                  order.interventionId
                    ? () => {
                        if (isSideRail) {
                          openDocumentPreview(
                            order.interventionId,
                            "material_order",
                            false,
                            pdfOverlayTarget,
                          );
                        } else {
                          ensureRightPanelOpen();
                          openDocumentPreview(order.interventionId, "material_order");
                        }
                      }
                    : undefined
                }
              />
            ))}
          </section>
        ) : null}
      </div>

      {previewOnSideRail ? (
        <ChatbotPdfPreviewOverlay
          title={documentPreview.title}
          loading={documentPreview.loading}
          error={documentPreview.error}
          blobUrl={documentPreview.blobUrl}
          onClose={closeDocumentPreview}
          testIdPrefix={isRightRail ? "company-stock-orders" : "chatbot-orders"}
        />
      ) : null}
    </div>
  );
}
