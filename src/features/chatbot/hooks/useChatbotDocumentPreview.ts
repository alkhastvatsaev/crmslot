"use client";

/**
 * Couche PWA : charge le PDF via GET /api/interventions/[id]/document-pdf (jsPDF).
 * Le chatbot ne fait qu'émettre document_preview (interventionId + type) après écriture Firestore.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import {
  CHATBOT_DOCUMENT_LABELS,
  type ChatbotDocumentKind,
  documentPdfApiPath,
  supplierOrderPdfApiPath,
} from "@/features/chatbot/chatbot-document";

import { getPdfFromCache, savePdfToCache } from "@/features/chatbot/chatbotPdfDb";
import type { DocumentPreviewOverlayTarget } from "@/features/chatbot/chatbot-document-preview-ui";

export type { DocumentPreviewOverlayTarget };

export type ChatbotDocumentPreviewState = {
  interventionId: string;
  kind: ChatbotDocumentKind;
  title: string;
  blobUrl: string | null;
  loading: boolean;
  error: string | null;
  /** Bon fournisseur (PDF companies/.../supplier-orders). */
  supplierOrderId?: string | null;
  /** Panneau qui affiche l'overlay PDF (gauche Commandes vs droite Documents). */
  overlayTarget: DocumentPreviewOverlayTarget | null;
};

const empty: ChatbotDocumentPreviewState = {
  interventionId: "",
  kind: "quote",
  title: "",
  blobUrl: null,
  loading: false,
  error: null,
  supplierOrderId: null,
  overlayTarget: null,
};

export function useChatbotDocumentPreview() {
  const [preview, setPreview] = useState<ChatbotDocumentPreviewState>(empty);
  const blobRef = useRef<string | null>(null);

  const revokeBlob = useCallback(() => {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }
  }, []);

  useEffect(() => () => revokeBlob(), [revokeBlob]);

  const loadPreview = useCallback(
    async (
      interventionId: string,
      kind: ChatbotDocumentKind,
      forceRefresh = false,
      overlayTarget: DocumentPreviewOverlayTarget = "right",
    ) => {
      const id = interventionId.trim();
      if (!id) return;

      revokeBlob();
      setPreview({
        interventionId: id,
        kind,
        title: CHATBOT_DOCUMENT_LABELS[kind],
        blobUrl: null,
        loading: true,
        error: null,
        supplierOrderId: null,
        overlayTarget,
      });

      try {
        let blob: Blob | null = null;
        if (!forceRefresh) {
          blob = await getPdfFromCache(id, kind);
        }

        if (!blob) {
          const res = await fetchWithAuth(documentPdfApiPath(id, kind));
          if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(text.slice(0, 200) || `Erreur ${res.status}`);
          }
          blob = await res.blob();
          await savePdfToCache(id, kind, blob);
        }

        const url = URL.createObjectURL(blob);
        blobRef.current = url;
        setPreview({
          interventionId: id,
          kind,
          title: CHATBOT_DOCUMENT_LABELS[kind],
          blobUrl: url,
          loading: false,
          error: null,
          supplierOrderId: null,
          overlayTarget,
        });
      } catch (e) {
        setPreview({
          interventionId: id,
          kind,
          title: CHATBOT_DOCUMENT_LABELS[kind],
          blobUrl: null,
          loading: false,
          error: e instanceof Error ? e.message : "Impossible de charger le PDF",
          supplierOrderId: null,
          overlayTarget,
        });
      }
    },
    [revokeBlob],
  );

  const openPreview = useCallback(
    (
      interventionId: string,
      kind: ChatbotDocumentKind,
      forceRefresh = false,
      overlayTarget: DocumentPreviewOverlayTarget = "right",
    ) => {
      void loadPreview(interventionId, kind, forceRefresh, overlayTarget);
    },
    [loadPreview],
  );

  const openSupplierOrderPdf = useCallback(
    async (
      companyId: string,
      orderId: string,
      forceRefresh = false,
      overlayTarget: DocumentPreviewOverlayTarget = "right",
    ) => {
      const cid = companyId.trim();
      const oid = orderId.trim();
      if (!cid || !oid) return;

      revokeBlob();
      setPreview({
        interventionId: "",
        kind: "material_order",
        title: "Bon de commande fournisseur",
        blobUrl: null,
        loading: true,
        error: null,
        supplierOrderId: oid,
        overlayTarget,
      });

      try {
        let blob: Blob | null = null;
        if (!forceRefresh) {
          blob = await getPdfFromCache("", "material_order", cid, oid);
        }

        if (!blob) {
          const res = await fetchWithAuth(supplierOrderPdfApiPath(cid, oid));
          if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(text.slice(0, 200) || `Erreur ${res.status}`);
          }
          blob = await res.blob();
          await savePdfToCache("", "material_order", blob, cid, oid);
        }
        
        const url = URL.createObjectURL(blob);
        blobRef.current = url;
        setPreview({
          interventionId: "",
          kind: "material_order",
          title: "Bon de commande fournisseur",
          blobUrl: url,
          loading: false,
          error: null,
          supplierOrderId: oid,
          overlayTarget,
        });
      } catch (e) {
        setPreview({
          interventionId: "",
          kind: "material_order",
          title: "Bon de commande fournisseur",
          blobUrl: null,
          loading: false,
          error: e instanceof Error ? e.message : "Impossible de charger le PDF",
          supplierOrderId: oid,
          overlayTarget,
        });
      }
    },
    [revokeBlob],
  );

  const setKind = useCallback(
    (kind: ChatbotDocumentKind) => {
      if (!preview.interventionId) return;
      void loadPreview(preview.interventionId, kind);
    },
    [loadPreview, preview.interventionId],
  );

  const refreshPreview = useCallback(() => {
    if (!preview.interventionId) return;
    void loadPreview(preview.interventionId, preview.kind);
  }, [loadPreview, preview.interventionId, preview.kind]);

  const closePreview = useCallback(() => {
    revokeBlob();
    setPreview(empty);
  }, [revokeBlob]);

  return {
    documentPreview: preview,
    openDocumentPreview: openPreview,
    openSupplierOrderPdf,
    setDocumentKind: setKind,
    refreshDocumentPreview: refreshPreview,
    closeDocumentPreview: closePreview,
  };
}
