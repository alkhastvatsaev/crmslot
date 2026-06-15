"use client";

import { useCallback } from "react";
import { useChatbotContextOptional } from "@/features/chatbot/ChatbotContext";
import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { useBackofficeInboxIntentOptional } from "@/context/BackofficeInboxIntentContext";
import { useBillingHubIntentOptional } from "@/context/BillingHubIntentContext";
import {
  CRMSLOT_FOCUS_STOCK_HUB_EVENT,
  useCompanyStockIntentOptional,
} from "@/context/CompanyStockIntentContext";
import { navigateBackOfficeHub } from "@/features/backoffice/backofficeHubNavigation";
import type { ChatbotStreamEvent } from "@/features/chatbot/chatbot-types";
import type { DocumentPreviewOverlayTarget } from "@/features/chatbot/chatbot-document-preview-ui";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";
import { dispatchCrmOrdersChanged } from "@/features/crmHistory/crmOrdersChangedEvent";

export type HubAgentStreamHandlerOptions = {
  /** Société active — signale le fil Historique après commande matériel. */
  companyId?: string | null;
  /** Facturation : naviguer vers la page Facturation avant l’aperçu PDF (rail documents). */
  billingDocumentOnBillingPage?: boolean;
  /** Cible overlay PDF (défaut materialRight sur page Matériel). */
  documentPreviewTarget?: DocumentPreviewOverlayTarget;
  /** Export comptable CSV — déclenché par trigger_accounting_export. */
  onExportAccountingCsv?: () => void;
  /** Export feuilles de temps CSV — déclenché par trigger_payroll_export. */
  onExportPayrollCsv?: () => void;
};

/** Callback pour brancher les effets UI des outils agents hub. */
export function useHubAgentStreamHandler(options?: HubAgentStreamHandlerOptions) {
  const pager = useDashboardPagerOptional();
  const stockIntent = useCompanyStockIntentOptional();
  const billingIntent = useBillingHubIntentOptional();
  const inboxIntent = useBackofficeInboxIntentOptional();
  const chatbot = useChatbotContextOptional();
  const billingDocOnBillingPage = options?.billingDocumentOnBillingPage ?? false;
  const docTarget = options?.documentPreviewTarget ?? "materialRight";
  const onExportAccountingCsv = options?.onExportAccountingCsv;
  const onExportPayrollCsv = options?.onExportPayrollCsv;

  return useCallback(
    (ev: ChatbotStreamEvent) => {
      if (ev.type === "export_accounting_csv") {
        onExportAccountingCsv?.();
        return;
      }

      if (ev.type === "export_payroll_csv") {
        onExportPayrollCsv?.();
        return;
      }
      if (ev.type === "focus_stock_hub") {
        pager?.setPageIndex(FEATURE_HUB_SLOT_INDEX);
        const detail = {
          stockItemId: ev.stockItemId ?? null,
          filter: ev.filter,
          searchQuery: ev.searchQuery ?? null,
        };
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent(CRMSLOT_FOCUS_STOCK_HUB_EVENT, { detail }));
        }
        stockIntent?.applyFocus(detail);
        return;
      }

      if (ev.type === "focus_billing_case" && billingIntent) {
        if (ev.filter) billingIntent.setFilter(ev.filter);
        if (ev.interventionId) billingIntent.setSelectedInterventionId(ev.interventionId);
        return;
      }

      if (ev.type === "open_crm_dossier") {
        inboxIntent?.setPendingInboxId(ev.interventionId);
        navigateBackOfficeHub(pager);
        return;
      }

      if (ev.type === "document_preview") {
        if (billingDocOnBillingPage) {
          pager?.setPageIndex(BILLING_HUB_SLOT_INDEX);
          chatbot?.openDocumentPreview(ev.interventionId, ev.documentType, true, "right");
        } else {
          chatbot?.openDocumentPreview(ev.interventionId, ev.documentType, true, docTarget);
        }
        return;
      }

      if (ev.type === "supplier_order_pdf") {
        chatbot?.ensureRightPanelOpen();
        void chatbot?.openSupplierOrderPdf(ev.companyId, ev.orderId, true, docTarget);
        return;
      }

      if (ev.type === "supplier_orders_panel") {
        chatbot?.openSupplierOrdersPanel(
          ev.highlightOrderId,
          ev.materialOrderId ?? null,
          ev.previewOrder
        );
        chatbot?.ensureRightPanelOpen();
        dispatchCrmOrdersChanged({
          companyId: options?.companyId ?? "",
          supplierOrderId: ev.highlightOrderId,
          materialOrderId: ev.materialOrderId ?? null,
        });
        return;
      }

      if (ev.type === "registry_refresh") {
        void chatbot?.refreshRegistry();
        const cid = (options?.companyId ?? "").trim();
        if (cid) dispatchCrmOrdersChanged({ companyId: cid });
      }
    },
    [
      pager,
      stockIntent,
      billingIntent,
      inboxIntent,
      chatbot,
      billingDocOnBillingPage,
      docTarget,
      options?.companyId,
      onExportAccountingCsv,
      onExportPayrollCsv,
    ]
  );
}
