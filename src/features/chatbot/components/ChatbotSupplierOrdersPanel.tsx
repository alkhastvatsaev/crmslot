"use client";

import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { isPreviewOverlayForTarget } from "@/features/chatbot/chatbot-document-preview-ui";
import {
  buildInterventionClientLabelMap,
  buildSupplierOrderClientNameByOrderId,
  buildSupplierOrderInterventionIdByOrderId,
  resolveMaterialOrderListClientLabel,
  resolveSupplierOrderListClientLabel,
} from "@/features/chatbot/chatbotOrderClientLabels";
import { buildChatbotOrderImageLookups } from "@/features/chatbot/chatbotOrderImageLookup";
import {
  summarizeMaterialOrderParts,
  summarizeSupplierOrderLines,
} from "@/features/chatbot/chatbotOrderListSummary";
import {
  resolveMaterialOrderTrackingProgress,
  resolveSupplierOrderTrackingProgress,
} from "@/features/chatbot/chatbotOrderTrackingProgress";
import ChatbotOrderListTile from "@/features/chatbot/components/ChatbotOrderListTile";
import ChatbotPdfPreviewOverlay from "@/features/chatbot/components/ChatbotPdfPreviewOverlay";
import { useChatbotContext } from "@/features/chatbot/ChatbotContext";
import { useChatbotOrderImages } from "@/features/chatbot/hooks/useChatbotOrderImages";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import type { SupplierOrder } from "@/features/suppliers/types";
import type { MaterialOrderDoc } from "@/features/materials/materialOrderFirestore";
import SupplierOrderDemoProgress from "@/features/chatbot/components/SupplierOrderDemoProgress";
import { capitalizeName } from "@/utils/stringUtils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { HUB_TYPE } from "@/core/ui/hub/hubTheme";

function isOpenSupplierOrder(order: SupplierOrder): boolean {
  return order.status === "draft" || order.status === "sent" || order.status === "confirmed";
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

function SupplierOrderRow({
  order,
  orderTitle,
  clientLabel,
  highlighted,
  onViewPdf,
}: {
  order: SupplierOrder;
  orderTitle: string;
  clientLabel: string;
  highlighted: boolean;
  onViewPdf: () => void;
}) {
  const { t } = useTranslation();
  const date = formatWhenShort(order.createdAt);
  const title =
    orderTitle.trim() ||
    order.lines[0]?.label?.trim() ||
    order.lines[0]?.sku?.trim() ||
    String(t("chatbot.order_untitled"));

  return (
    <article
      data-testid={`chatbot-supplier-order-${order.id}`}
      className={cn(
        "group border-b border-slate-100 last:border-b-0 transition-colors",
        highlighted ? "bg-slate-50" : "hover:bg-slate-50/60"
      )}
    >
      <button
        type="button"
        className="w-full px-4 py-3 text-left"
        onClick={onViewPdf}
        data-testid={`chatbot-supplier-order-pdf-${order.id}`}
        aria-label={String(t("chatbot.view_supplier_order_pdf"))}
      >
        <div className="flex items-start justify-between gap-2">
          <p
            className="min-w-0 flex-1 line-clamp-2 text-[13px] font-semibold leading-snug text-slate-900"
            data-testid="chatbot-order-title"
          >
            {title}
          </p>
          {order.emailPending ? (
            <span
              className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700"
              title="Email non envoyé — reconnectez Gmail"
            >
              Email ⚠
            </span>
          ) : null}
        </div>
        <p
          className="mt-1 truncate text-[11px] text-slate-500"
          data-testid="chatbot-order-client-label"
        >
          {capitalizeName(clientLabel)}
          {date ? ` · ${date}` : ""}
        </p>
        {isOpenSupplierOrder(order) ? (
          <SupplierOrderDemoProgress
            orderId={order.id}
            status={order.status}
            createdAt={order.createdAt}
            sentAt={order.sentAt}
            deliveredAt={order.deliveredAt}
          />
        ) : null}
      </button>
    </article>
  );
}

function MaterialOrderRow({
  order,
  orderTitle,
  clientLabel,
  highlighted,
  onViewPdf,
}: {
  order: MaterialOrderDoc;
  orderTitle: string;
  clientLabel: string;
  highlighted: boolean;
  onViewPdf?: () => void;
}) {
  const { t } = useTranslation();
  const date = formatWhenShort(order.createdAt);
  const title =
    orderTitle.trim() ||
    order.partsRequested[0]?.description?.trim() ||
    String(t("chatbot.order_untitled"));

  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p
          className="min-w-0 flex-1 line-clamp-2 text-[13px] font-semibold leading-snug text-slate-900"
          data-testid="chatbot-order-title"
        >
          {title}
        </p>
        {date ? <span className="shrink-0 text-[11px] text-slate-400">{date}</span> : null}
      </div>
      <p
        className="mt-1 truncate text-[11px] text-slate-500"
        data-testid="chatbot-order-client-label"
      >
        {capitalizeName(clientLabel)}
      </p>
    </>
  );

  return (
    <article
      data-testid={`chatbot-material-order-${order.id}`}
      className={cn(
        "border-b border-slate-100 last:border-b-0 transition-colors",
        highlighted ? "bg-slate-50" : onViewPdf ? "hover:bg-slate-50/60" : "opacity-70"
      )}
    >
      {onViewPdf ? (
        <button
          type="button"
          className="w-full px-4 py-3 text-left"
          onClick={onViewPdf}
          data-testid={`chatbot-material-order-pdf-${order.id}`}
          aria-label={String(t("chatbot.view_material_order_pdf"))}
        >
          {inner}
        </button>
      ) : (
        <div className="px-4 py-3">{inner}</div>
      )}
    </article>
  );
}

type ChatbotSupplierOrdersPanelProps = {
  placement?: "leftRail" | "rightRail" | "embedded";
};

export default function ChatbotSupplierOrdersPanel({
  placement = "embedded",
}: ChatbotSupplierOrdersPanelProps) {
  const { t } = useTranslation();
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
    [chatbotInvoices, workspaceSnapshot, interventions]
  );

  const orderInterventionIdByOrderId = useMemo(
    () => buildSupplierOrderInterventionIdByOrderId(supplierOrders, materialOrders),
    [supplierOrders, materialOrders]
  );

  const clientNameBySupplierOrderId = useMemo(
    () => buildSupplierOrderClientNameByOrderId(supplierOrders, materialOrders),
    [supplierOrders, materialOrders]
  );

  const supplierOrderClientLabel = useCallback(
    (order: SupplierOrder) =>
      resolveSupplierOrderListClientLabel(
        order,
        clientNameBySupplierOrderId,
        orderInterventionIdByOrderId,
        clientLabelByInterventionId
      ),
    [clientNameBySupplierOrderId, orderInterventionIdByOrderId, clientLabelByInterventionId]
  );

  const materialOrderClientLabel = useCallback(
    (order: MaterialOrderDoc) =>
      resolveMaterialOrderListClientLabel(order, clientLabelByInterventionId),
    [clientLabelByInterventionId]
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

  const hasBoth = supplierOrders.length > 0 && materialOrders.length > 0;
  const pendingEmailCount = supplierOrders.filter((o) => o.emailPending).length;

  const orderImageLookups = useMemo(() => {
    if (!isRightRail) return [];
    return buildChatbotOrderImageLookups(supplierOrders.slice(0, 15), materialOrders);
  }, [isRightRail, supplierOrders, materialOrders]);
  const orderImages = useChatbotOrderImages(orderImageLookups, { enabled: isRightRail });

  const renderRightRailList = () => (
    <ul
      data-testid="chatbot-orders-list-rail"
      data-layout="list"
      className="flex flex-col gap-2.5 p-2.5"
    >
      {supplierOrders.slice(0, 15).map((order) => {
        const orderTitle = summarizeSupplierOrderLines(order.lines);
        const clientLabel = supplierOrderClientLabel(order);
        const date = formatWhenShort(order.createdAt);
        const title =
          orderTitle.trim() ||
          order.lines[0]?.label?.trim() ||
          order.lines[0]?.sku?.trim() ||
          String(t("chatbot.order_untitled"));
        const tracking = resolveSupplierOrderTrackingProgress(order.status, {
          createdAt: order.createdAt,
          sentAt: order.sentAt,
          deliveredAt: order.deliveredAt,
        });

        return (
          <li key={`supplier-${order.id}`} className="min-w-0">
            <ChatbotOrderListTile
              orderId={order.id}
              title={title}
              subtitle={[capitalizeName(clientLabel), date].filter(Boolean).join(" · ")}
              imageUrl={orderImages[order.id]}
              tracking={tracking}
              highlighted={isSupplierHighlighted(order.id)}
              testIdPrefix="chatbot-supplier-order"
              ariaLabel={String(t("chatbot.view_supplier_order_pdf"))}
              onClick={() => {
                if (!companyId) return;
                void openSupplierOrderPdf(companyId, order.id, false, pdfOverlayTarget);
              }}
            />
          </li>
        );
      })}
      {materialOrders.map((order) => {
        const orderTitle = summarizeMaterialOrderParts(order.partsRequested);
        const clientLabel = materialOrderClientLabel(order);
        const date = formatWhenShort(order.createdAt);
        const title =
          orderTitle.trim() ||
          order.partsRequested[0]?.description?.trim() ||
          String(t("chatbot.order_untitled"));
        const tracking = resolveMaterialOrderTrackingProgress(order.status);

        return (
          <li key={`material-${order.id}`} className="min-w-0">
            <ChatbotOrderListTile
              orderId={order.id}
              title={title}
              subtitle={[capitalizeName(clientLabel), date].filter(Boolean).join(" · ")}
              imageUrl={orderImages[order.id]}
              tracking={tracking}
              highlighted={isMaterialHighlighted(order.id)}
              testIdPrefix="chatbot-material-order"
              ariaLabel={
                order.interventionId ? String(t("chatbot.view_material_order_pdf")) : undefined
              }
              clickable={Boolean(order.interventionId)}
              onClick={
                order.interventionId
                  ? () =>
                      openDocumentPreview(
                        order.interventionId,
                        "material_order",
                        false,
                        pdfOverlayTarget
                      )
                  : undefined
              }
            />
          </li>
        );
      })}
    </ul>
  );

  const renderOrdersList = () => (
    <>
      <section data-testid="chatbot-supplier-orders-section">
        {hasBoth && supplierOrders.length > 0 && !isRightRail ? (
          <div className="px-4 pb-1 pt-2">
            <span className={cn(HUB_TYPE.eyebrow, "text-[10px]")}>Fournisseur</span>
          </div>
        ) : null}
        {supplierOrders.slice(0, 15).map((order) => (
          <SupplierOrderRow
            key={order.id}
            order={order}
            orderTitle={summarizeSupplierOrderLines(order.lines)}
            clientLabel={supplierOrderClientLabel(order)}
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
          className={cn(hasBoth && "mt-2 border-t border-slate-100 pt-1")}
        >
          {hasBoth ? (
            <div className="px-4 pb-1 pt-2">
              <span className={cn(HUB_TYPE.eyebrow, "text-[10px]")}>Matériel</span>
            </div>
          ) : null}
          {materialOrders.map((order) => (
            <MaterialOrderRow
              key={order.id}
              order={order}
              orderTitle={summarizeMaterialOrderParts(order.partsRequested)}
              clientLabel={materialOrderClientLabel(order)}
              highlighted={isMaterialHighlighted(order.id)}
              onViewPdf={
                order.interventionId
                  ? () => {
                      if (isSideRail) {
                        openDocumentPreview(
                          order.interventionId,
                          "material_order",
                          false,
                          pdfOverlayTarget
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
    </>
  );

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
      data-testid={
        isLeftRail
          ? "chatbot-orders-left-panel"
          : isRightRail
            ? "company-stock-orders-panel"
            : "chatbot-supplier-orders-panel"
      }
    >
      {/* Header — masqué sur le rail Matériel (droite) */}
      {isRightRail ? null : isSideRail ? (
        <div className="shrink-0 px-4 pt-4 pb-3">
          <div className="flex items-center justify-between gap-2">
            <span className={HUB_TYPE.eyebrow}>{t("chatbot.orders_heading")}</span>
            {totalCount > 0 ? (
              <span className="text-[11px] font-medium tabular-nums text-slate-400">
                {totalCount}
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 pb-2.5 pt-3">
          <h2 className={HUB_TYPE.title}>{t("chatbot.orders_and_slips_heading")}</h2>
          <button
            type="button"
            data-testid="chatbot-supplier-orders-close"
            onClick={closeSupplierOrdersPanel}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label={String(t("chatbot.close_preview"))}
          >
            <span className="text-[16px] leading-none">×</span>
          </button>
        </header>
      )}

      {/* List */}
      <div
        className="custom-scrollbar min-h-0 flex-1 overflow-y-auto"
        data-testid="chatbot-orders-list"
      >
        {pendingEmailCount > 0 ? (
          <p
            className="mx-4 mb-2 mt-1 rounded-[12px] bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-800"
            data-testid="chatbot-pending-email-banner"
          >
            ⚠ {pendingEmailCount} bon{pendingEmailCount > 1 ? "s" : ""} non envoyé
            {pendingEmailCount > 1 ? "s" : ""} — reconnectez Gmail pour les transmettre à Lecot.
          </p>
        ) : null}
        {registryError ? (
          <p
            className="mx-4 mb-2 mt-1 rounded-[12px] bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-800"
            data-testid="chatbot-registry-error"
          >
            {registryError}
          </p>
        ) : null}

        {supplierOrders.length === 0 && materialOrders.length === 0 ? (
          <p
            className="px-4 py-10 text-center text-[12px] text-slate-400"
            data-testid="chatbot-supplier-orders-empty"
          >
            {t("chatbot.orders_empty")}
          </p>
        ) : null}

        {isRightRail ? renderRightRailList() : renderOrdersList()}
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
