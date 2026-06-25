"use client";

import { useCallback, useMemo, useState } from "react";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useBackofficeInboxIntentOptional } from "@/context/BackofficeInboxIntentContext";
import { useBillingHubIntentOptional } from "@/context/BillingHubIntentContext";
import { useDashboardPagerOptional } from "@/features/dashboard";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
import { useMobileMapPagePowerGate } from "@/features/dashboard/hooks/useMobileMapPagePowerGate";
import { useMobileHubRailSnapshot } from "@/features/dashboard/MobileHubRailContext";
import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
import { isPreviewOverlayForTarget } from "@/features/chatbot/chatbot-document-preview-ui";
import {
  buildInterventionClientLabelMap,
  buildSupplierOrderClientNameByOrderId,
  buildSupplierOrderInterventionIdByOrderId,
  resolveSupplierOrderListClientLabel,
} from "@/features/chatbot/chatbotOrderClientLabels";
import { resolveSelectedKey } from "@/features/chatbot/chatbotDocumentsPanelHelpers";
import { useChatbotContext } from "@/features/chatbot/ChatbotContext";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import {
  filterChatbotInvoices,
  filterChatbotSupplierOrders,
  mergeChatbotDocumentsByCreatedAt,
  parseDocumentsSearchQuery,
} from "@/features/chatbot/filterChatbotDocuments";
import {
  invoiceTileKey,
  supplierTileKey,
  useChatbotDocumentTileThumbnails,
} from "@/features/chatbot/hooks/useChatbotDocumentTileThumbnails";
import type { SupplierOrder } from "@/features/suppliers";

export function useChatbotDocumentsRightPanelController() {
  const {
    companyId,
    chatbotInvoices,
    chatbotInvoicesLoading,
    supplierOrders,
    materialOrders,
    workspaceSnapshot,
    documentPreview,
    openDocumentPreview,
    openSupplierOrderPdf,
    closeDocumentPreview,
  } = useChatbotContext();

  const workspace = useCompanyWorkspaceOptional();
  const isMobile = useIsMobile();
  const pager = useDashboardPagerOptional();
  const inboxIntent = useBackofficeInboxIntentOptional();
  const billingIntent = useBillingHubIntentOptional();
  const railSnapshot = useMobileHubRailSnapshot();
  const powerGate = useMobileMapPagePowerGate(inboxIntent?.activeInboxTab);
  const billingHubDocumentsRailActive =
    pager?.pageIndex === BILLING_HUB_SLOT_INDEX &&
    (billingIntent?.rightPanelTab ?? "documents") === "documents" &&
    (isMobile !== true || railSnapshot?.activeRail === "right");
  const interventionsCompanyId =
    (workspace?.isTenantUser ? workspace.activeCompanyId : null) ?? companyId;
  const interventionsFirestoreEnabled =
    isMobile !== true ||
    (powerGate.inboxDataActive && powerGate.documentsTabActive) ||
    billingHubDocumentsRailActive;
  const { interventions } = useBackOfficeInterventions(
    interventionsFirestoreEnabled ? interventionsCompanyId : null
  );

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

  const invoiceClientLabel = useCallback(
    (interventionId: string, fallback: string) =>
      clientLabelByInterventionId.get(interventionId)?.trim() || fallback,
    [clientLabelByInterventionId]
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

  const [searchQuery, setSearchQuery] = useState("");

  const selectedKey = resolveSelectedKey(documentPreview);
  const previewOpen = isPreviewOverlayForTarget(documentPreview, "right");

  const parsedSearch = useMemo(() => parseDocumentsSearchQuery(searchQuery), [searchQuery]);

  const filteredInvoices = useMemo(
    () => filterChatbotInvoices(chatbotInvoices, parsedSearch),
    [chatbotInvoices, parsedSearch]
  );

  const filteredOrders = useMemo(
    () => filterChatbotSupplierOrders(supplierOrders, parsedSearch),
    [supplierOrders, parsedSearch]
  );

  const documentItems = useMemo(
    () => mergeChatbotDocumentsByCreatedAt(filteredInvoices, filteredOrders),
    [filteredInvoices, filteredOrders]
  );

  const docCount = documentItems.length;
  const libraryCount = chatbotInvoices.length + supplierOrders.length;
  const hasLibrary = libraryCount > 0;
  const hasList = docCount > 0;
  const showSearchNoResults =
    parsedSearch.hasQuery && !chatbotInvoicesLoading && hasLibrary && !hasList;

  const filteredInvoiceIds = useMemo(
    () => filteredInvoices.map((row) => row.interventionId),
    [filteredInvoices]
  );
  const filteredOrderIds = useMemo(() => filteredOrders.map((order) => order.id), [filteredOrders]);
  const { thumbnails, thumbnailLoading } = useChatbotDocumentTileThumbnails(
    companyId,
    filteredInvoiceIds,
    filteredOrderIds,
    interventionsFirestoreEnabled
  );

  return {
    companyId,
    chatbotInvoicesLoading,
    documentPreview,
    openDocumentPreview,
    openSupplierOrderPdf,
    closeDocumentPreview,
    searchQuery,
    setSearchQuery,
    selectedKey,
    previewOpen,
    parsedSearch,
    documentItems,
    docCount,
    libraryCount,
    hasLibrary,
    hasList,
    showSearchNoResults,
    thumbnails,
    thumbnailLoading,
    invoiceClientLabel,
    supplierOrderClientLabel,
    invoiceTileKey,
    supplierTileKey,
  };
}
