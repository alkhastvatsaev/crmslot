"use client";

import { formatWhenShort } from "@/features/chatbot/chatbotOrderListFormat";
import {
  summarizeMaterialOrderParts,
  summarizeSupplierOrderLines,
} from "@/features/chatbot/chatbotOrderListSummary";
import {
  resolveMaterialOrderTrackingProgress,
  resolveSupplierOrderTrackingProgress,
} from "@/features/chatbot/chatbotOrderTrackingProgress";
import ChatbotOrderListTile from "@/features/chatbot/components/ChatbotOrderListTile";
import type { useChatbotSupplierOrdersPanelView } from "@/features/chatbot/hooks/useChatbotSupplierOrdersPanelView";
import type { MaterialOrderDoc } from "@/features/materials/materialOrderFirestore";
import type { SupplierOrder } from "@/features/suppliers/types";
import { capitalizeName } from "@/utils/stringUtils";

type View = ReturnType<typeof useChatbotSupplierOrdersPanelView>;

export default function ChatbotSupplierOrdersRightRailList({ view }: { view: View }) {
  const {
    t,
    supplierOrders,
    materialOrders,
    supplierOrderClientLabel,
    materialOrderClientLabel,
    isSupplierHighlighted,
    isMaterialHighlighted,
    orderImages,
    companyId,
    pdfOverlayTarget,
    openSupplierOrderPdf,
    openDocumentPreview,
  } = view;

  return (
    <ul
      data-testid="chatbot-orders-list-rail"
      data-layout="list"
      className="flex flex-col gap-2.5 p-2.5"
    >
      {supplierOrders.slice(0, 15).map((order: SupplierOrder) => {
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
      {materialOrders.map((order: MaterialOrderDoc) => {
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
}
