"use client";

import { logger } from "@/core/logger";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { firestore } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useChatbotContextOptional } from "@/features/chatbot/ChatbotContext";
import ChatbotPdfPreviewPanel from "@/features/chatbot/components/ChatbotPdfPreviewPanel";
import { ArrowLeft, Package } from "lucide-react";
import type { SupplierOrder } from "@/features/suppliers";

type Props = {
  interventionId: string | null;
  companyId: string | null;
};

export function CompanyHubDocumentsTab({ interventionId, companyId }: Props) {
  const { t } = useTranslation();
  const chatbotCtx = useChatbotContextOptional();
  const [orders, setOrders] = useState<SupplierOrder[]>([]);

  useEffect(() => {
    if (!interventionId || !companyId || !firestore) return;
    const db = firestore;
    const fetchOrders = async () => {
      const q = query(
        collection(db, "companies", companyId, "supplierOrders"),
        where("interventionId", "==", interventionId)
      );
      try {
        const snap = await getDocs(q);
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SupplierOrder));
      } catch (e) {
        logger.error("Error fetching supplier orders", {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    };
    fetchOrders();
  }, [interventionId, companyId]);

  if (!interventionId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-[14px] text-slate-500">
        Aucun document disponible pour le moment.
      </div>
    );
  }

  // If a document is currently open in preview, show it with a back button.
  if (chatbotCtx?.documentPreview.blobUrl || chatbotCtx?.documentPreview.loading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-slate-50">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <button
            onClick={() => chatbotCtx.closeDocumentPreview()}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la liste
          </button>
          <span className="text-xs font-medium text-slate-400">
            {chatbotCtx.documentPreview.title}
          </span>
        </div>
        <div className="flex-1 min-h-0 relative">
          <ChatbotPdfPreviewPanel />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-slate-50 p-4 sm:p-6">
      <h3 className="mb-6 text-[15px] font-semibold text-slate-900">
        Documents liés à l&apos;intervention
      </h3>

      <div className="flex flex-col gap-4">
        {orders.length > 0 && (
          <div className="mt-4">
            <h4 className="mb-3 pl-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Bons de commande ({orders.length})
            </h4>
            <div className="flex flex-col gap-3">
              {orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => {
                    if (companyId) {
                      chatbotCtx?.openSupplierOrderPdf(companyId, order.id);
                    }
                  }}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                    <Package className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-[14px] font-semibold text-slate-900 transition-colors group-hover:text-indigo-700">
                      Bon de commande fournisseur
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[12px] text-slate-500">
                      <span>Réf. {order.id.slice(0, 8)}</span>
                      {order.totalCents ? (
                        <>
                          <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                          <span className="font-medium text-slate-700">
                            {(order.totalCents / 100).toFixed(2)} €
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
