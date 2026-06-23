"use client";

import { cn } from "@/lib/utils";
import {
  summarizeMaterialOrderParts,
  summarizeSupplierOrderLines,
} from "@/features/chatbot/chatbotOrderListSummary";
import ChatbotMaterialOrderRow from "@/features/chatbot/components/ChatbotMaterialOrderRow";
import ChatbotSupplierOrderRow from "@/features/chatbot/components/ChatbotSupplierOrderRow";
import type { useChatbotSupplierOrdersPanelView } from "@/features/chatbot/hooks/useChatbotSupplierOrdersPanelView";
import { HUB_TYPE } from "@/core/ui/hub/hubTheme";

type View = ReturnType<typeof useChatbotSupplierOrdersPanelView>;

export default function ChatbotSupplierOrdersEmbeddedList({ view }: { view: View }) {
  const {
    supplierOrders,
    materialOrders,
    hasBoth,
    isRightRail,
    supplierOrderClientLabel,
    materialOrderClientLabel,
    isSupplierHighlighted,
    isMaterialHighlighted,
    openSupplierPdf,
    openMaterialPdf,
  } = view;

  return (
    <>
      <section data-testid="chatbot-supplier-orders-section">
        {hasBoth && supplierOrders.length > 0 && !isRightRail ? (
          <div className="px-4 pb-1 pt-2">
            <span className={cn(HUB_TYPE.eyebrow, "text-[10px]")}>Fournisseur</span>
          </div>
        ) : null}
        {supplierOrders.slice(0, 15).map((order) => (
          <ChatbotSupplierOrderRow
            key={order.id}
            order={order}
            orderTitle={summarizeSupplierOrderLines(order.lines)}
            clientLabel={supplierOrderClientLabel(order)}
            highlighted={isSupplierHighlighted(order.id)}
            onViewPdf={() => openSupplierPdf(order.id)}
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
            <ChatbotMaterialOrderRow
              key={order.id}
              order={order}
              orderTitle={summarizeMaterialOrderParts(order.partsRequested)}
              clientLabel={materialOrderClientLabel(order)}
              highlighted={isMaterialHighlighted(order.id)}
              onViewPdf={
                order.interventionId ? () => openMaterialPdf(order.interventionId) : undefined
              }
            />
          ))}
        </section>
      ) : null}
    </>
  );
}
