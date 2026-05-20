"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import { firestore } from "@/core/config/firebase";
import { fetchChatbotPwaRegistry } from "@/features/chatbot/fetchChatbotPwaRegistry";
import { subscribeSupplierOrders } from "@/features/suppliers/supplierFirestore";
import type { SupplierOrder } from "@/features/suppliers/types";
import type { MaterialOrderDoc } from "@/features/materials/materialOrderFirestore";

export type ChatbotSupplierOrdersPanelState = {
  open: boolean;
  highlightOrderId: string | null;
  highlightMaterialOrderId: string | null;
};

const closed: ChatbotSupplierOrdersPanelState = {
  open: true,
  highlightOrderId: null,
  highlightMaterialOrderId: null,
};

function parseOrderDate(raw: unknown): number {
  if (!raw) return 0;
  if (typeof raw === "object" && raw !== null && "seconds" in raw) {
    return (raw as { seconds: number }).seconds * 1000;
  }
  const t = Date.parse(String(raw));
  return Number.isFinite(t) ? t : 0;
}

function mergeSupplierOrders(
  firestoreOrders: SupplierOrder[],
  previewOrders: SupplierOrder[],
): SupplierOrder[] {
  const byId = new Map<string, SupplierOrder>();
  for (const o of previewOrders) byId.set(o.id, o);
  for (const o of firestoreOrders) byId.set(o.id, o);
  return [...byId.values()].sort((a, b) => parseOrderDate(b.createdAt) - parseOrderDate(a.createdAt));
}

export function useChatbotSupplierOrdersPanel(
  companyId: string | null,
  firebaseUid?: string | null,
) {
  const [panel, setPanel] = useState<ChatbotSupplierOrdersPanelState>(closed);
  const [supplierOrdersBase, setSupplierOrdersBase] = useState<SupplierOrder[]>([]);
  const [previewSupplierOrders, setPreviewSupplierOrders] = useState<SupplierOrder[]>([]);
  const [materialOrders, setMaterialOrders] = useState<MaterialOrderDoc[]>([]);
  const [registryError, setRegistryError] = useState<string | null>(null);

  const supplierOrders = useMemo(
    () => mergeSupplierOrders(supplierOrdersBase, previewSupplierOrders),
    [supplierOrdersBase, previewSupplierOrders],
  );

  const refreshRegistry = useCallback(async () => {
    if (!companyId) return;
    const result = await fetchChatbotPwaRegistry(companyId);
    if (result.ok) {
      setRegistryError(null);
      setSupplierOrdersBase(result.data.supplierOrders);
      setMaterialOrders(result.data.materialOrders);
      return;
    }
    if (result.status === 503) {
      console.warn("[chatbot] pwa-registry (Firestore client utilisé):", result.message);
      return;
    }
    console.warn("[chatbot] pwa-registry:", result.message);
  }, [companyId, firebaseUid]);

  useEffect(() => {
    if (!panel.open || !companyId) {
      setSupplierOrdersBase([]);
      setMaterialOrders([]);
      return;
    }

    void refreshRegistry();

    if (!firestore) return;

    return subscribeSupplierOrders(firestore, companyId, (rows) => {
      setSupplierOrdersBase((prev) => mergeSupplierOrders(rows, prev));
      if (rows.length > 0) setRegistryError(null);
    });
  }, [panel.open, companyId, refreshRegistry]);

  useEffect(() => {
    if (!panel.open || !companyId || !firestore) return;
    const db = firestore as Firestore;
    const q = query(
      collection(db, "material_orders"),
      where("companyId", "==", companyId),
      limit(40),
    );
    return onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<MaterialOrderDoc, "id">) }))
          .sort((a, b) => parseOrderDate(b.createdAt) - parseOrderDate(a.createdAt));
        setMaterialOrders((prev) => {
          const byId = new Map<string, MaterialOrderDoc>();
          for (const r of prev) byId.set(r.id, r);
          for (const r of rows) byId.set(r.id, r);
          const merged = [...byId.values()].sort(
            (a, b) => parseOrderDate(b.createdAt) - parseOrderDate(a.createdAt),
          );
          if (merged.length > 0) setRegistryError(null);
          return merged;
        });
      },
      (err) => {
        console.warn("[material_orders] onSnapshot error:", err);
      },
    );
  }, [panel.open, companyId]);

  const openSupplierOrdersPanel = useCallback(
    (
      highlightOrderId: string,
      materialOrderId?: string | null,
      previewOrder?: SupplierOrder | null,
    ) => {
      if (previewOrder) {
        setPreviewSupplierOrders((prev) => {
          const next = prev.filter((o) => o.id !== previewOrder.id);
          return [previewOrder, ...next].slice(0, 10);
        });
      }
      setPanel((prev) => ({
        ...prev,
        open: true,
        highlightOrderId: highlightOrderId.trim() || null,
        highlightMaterialOrderId: materialOrderId?.trim() || null,
      }));
      void refreshRegistry();
    },
    [refreshRegistry],
  );

  const closeSupplierOrdersPanel = useCallback(() => {
    setPanel((prev) => ({ ...prev, open: false }));
  }, []);

  const ensureRightPanelOpen = useCallback(() => {
    setPanel((prev) => ({ ...prev, open: true }));
  }, []);

  return {
    supplierOrdersPanel: panel,
    supplierOrders,
    materialOrders,
    registryError,
    refreshRegistry,
    openSupplierOrdersPanel,
    closeSupplierOrdersPanel,
    ensureRightPanelOpen,
  };
}
