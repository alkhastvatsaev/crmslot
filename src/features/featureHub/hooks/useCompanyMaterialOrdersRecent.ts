"use client";

import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, query, where } from "firebase/firestore";
import { firestore } from "@/core/config/firebase";
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

/** Dernières commandes matériel — Firestore uniquement. */
export function useCompanyMaterialOrdersRecent(companyId: string | null) {
  const [orders, setOrders] = useState<MaterialOrderDoc[]>([]);
  const [loading, setLoading] = useState(Boolean(companyId));

  useEffect(() => {
    if (!companyId || !firestore) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(firestore, MATERIAL_ORDERS_COLLECTION),
      where("companyId", "==", companyId),
      limit(RECENT_LIMIT)
    );
    return onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<MaterialOrderDoc, "id">) }))
          .sort((a, b) => parseOrderMs(b.createdAt) - parseOrderMs(a.createdAt));
        setOrders(rows);
        setLoading(false);
      },
      () => {
        setOrders([]);
        setLoading(false);
      }
    );
  }, [companyId]);

  const dismissDemoOrder = (_orderId: string) => {};

  return { orders, loading, isPreviewOrders: false, dismissDemoOrder };
}
