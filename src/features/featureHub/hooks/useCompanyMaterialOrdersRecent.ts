"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, limit, onSnapshot, query, where } from "firebase/firestore";
import { firestore } from "@/core/config/firebase";
import {
  demoMaterialOrdersForCompany,
  isDemoMaterialOrderId,
} from "@/features/dev/demoCompanyStock";
import {
  MATERIAL_ORDERS_COLLECTION,
  type MaterialOrderDoc,
} from "@/features/materials/materialOrderFirestore";

const RECENT_LIMIT = 50;

function parseOrderMs(raw: unknown): number {
  if (!raw) return 0;
  if (typeof raw === "object" && raw !== null && "seconds" in raw) {
    return (raw as { seconds: number }).seconds * 1000;
  }
  const t = Date.parse(String(raw));
  return Number.isFinite(t) ? t : 0;
}

/** Dernières commandes matériel — Firestore + aperçu métier si vide. */
export function useCompanyMaterialOrdersRecent(companyId: string | null) {
  const [liveOrders, setLiveOrders] = useState<MaterialOrderDoc[]>([]);
  const [dismissedDemoIds, setDismissedDemoIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(Boolean(companyId));

  useEffect(() => {
    if (!companyId || !firestore) {
      setLiveOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(firestore, MATERIAL_ORDERS_COLLECTION),
      where("companyId", "==", companyId),
      limit(RECENT_LIMIT),
    );
    return onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<MaterialOrderDoc, "id">) }))
          .sort((a, b) => parseOrderMs(b.createdAt) - parseOrderMs(a.createdAt));
        setLiveOrders(rows);
        setLoading(false);
      },
      () => {
        setLiveOrders([]);
        setLoading(false);
      },
    );
  }, [companyId]);

  const isPreviewOrders = liveOrders.length === 0 && Boolean(companyId);

  const orders = useMemo(() => {
    const base =
      liveOrders.length > 0
        ? liveOrders
        : companyId
          ? demoMaterialOrdersForCompany(companyId)
          : [];
    return base.filter((o) => !dismissedDemoIds.has(o.id));
  }, [liveOrders, companyId, dismissedDemoIds]);

  const dismissDemoOrder = (orderId: string) => {
    if (!isDemoMaterialOrderId(orderId)) return;
    setDismissedDemoIds((prev) => new Set(prev).add(orderId));
  };

  return { orders, loading, isPreviewOrders, dismissDemoOrder };
}
