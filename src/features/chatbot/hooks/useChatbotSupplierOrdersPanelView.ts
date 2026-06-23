"use client";

import { useCallback, useMemo } from "react";
import { isPreviewOverlayForTarget } from "@/features/chatbot/chatbot-document-preview-ui";
import {
  buildInterventionClientLabelMap,
  buildSupplierOrderClientNameByOrderId,
  buildSupplierOrderInterventionIdByOrderId,
  resolveMaterialOrderListClientLabel,
  resolveSupplierOrderListClientLabel,
} from "@/features/chatbot/chatbotOrderClientLabels";
import { buildChatbotOrderImageLookups } from "@/features/chatbot/chatbotOrderImageLookup";
import { useChatbotContext } from "@/features/chatbot/ChatbotContext";
import { useChatbotOrderImages } from "@/features/chatbot/hooks/useChatbotOrderImages";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import type { SupplierOrder } from "@/features/suppliers";
import type { MaterialOrderDoc } from "@/features/materials";
import { useTranslation } from "@/core/i18n/I18nContext";

export type ChatbotSupplierOrdersPlacement = "leftRail" | "rightRail" | "embedded";

export function useChatbotSupplierOrdersPanelView(placement: ChatbotSupplierOrdersPlacement) {
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
    isSideRail ? documentPreview?.supplierOrderId === orderId : orderId === highlightId;

  const isMaterialHighlighted = (orderId: string) =>
    isSideRail
      ? highlightMaterialId === orderId && documentPreview?.kind === "material_order"
      : orderId === highlightMaterialId;

  const hasBoth = supplierOrders.length > 0 && materialOrders.length > 0;
  const pendingEmailCount = supplierOrders.filter((o) => o.emailPending).length;

  const orderImageLookups = useMemo(() => {
    if (!isRightRail) return [];
    return buildChatbotOrderImageLookups(supplierOrders.slice(0, 15), materialOrders);
  }, [isRightRail, supplierOrders, materialOrders]);
  const orderImages = useChatbotOrderImages(orderImageLookups, { enabled: isRightRail });

  const openSupplierPdf = useCallback(
    (orderId: string) => {
      if (!companyId) return;
      if (isSideRail) {
        void openSupplierOrderPdf(companyId, orderId, false, pdfOverlayTarget);
      } else {
        ensureRightPanelOpen();
        void openSupplierOrderPdf(companyId, orderId);
      }
    },
    [companyId, ensureRightPanelOpen, isSideRail, openSupplierOrderPdf, pdfOverlayTarget]
  );

  const openMaterialPdf = useCallback(
    (interventionId: string) => {
      if (isSideRail) {
        openDocumentPreview(interventionId, "material_order", false, pdfOverlayTarget);
      } else {
        ensureRightPanelOpen();
        openDocumentPreview(interventionId, "material_order");
      }
    },
    [ensureRightPanelOpen, isSideRail, openDocumentPreview, pdfOverlayTarget]
  );

  return {
    t,
    companyId,
    supplierOrders,
    materialOrders,
    registryError,
    closeSupplierOrdersPanel,
    documentPreview,
    closeDocumentPreview,
    isLeftRail,
    isRightRail,
    isSideRail,
    pdfOverlayTarget,
    totalCount,
    previewOnSideRail,
    pendingEmailCount,
    hasBoth,
    supplierOrderClientLabel,
    materialOrderClientLabel,
    isSupplierHighlighted,
    isMaterialHighlighted,
    orderImages,
    openSupplierPdf,
    openMaterialPdf,
    openSupplierOrderPdf,
    openDocumentPreview,
  };
}
