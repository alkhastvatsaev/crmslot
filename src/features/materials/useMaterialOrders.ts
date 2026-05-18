"use client";

import { useEffect, useState } from "react";
import { firestore } from "@/core/config/firebase";
import {
  subscribeMaterialOrders,
  type MaterialOrderDoc,
} from "@/features/materials/materialOrderFirestore";
import { scheduleEffectUpdate } from "@/utils/scheduleEffectUpdate";

export function useMaterialOrders(interventionId: string | null) {
  const activeId = interventionId?.trim() || null;
  const [orders, setOrders] = useState<MaterialOrderDoc[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeId || !firestore) return;
    scheduleEffectUpdate(() => setLoading(true));
    const unsub = subscribeMaterialOrders(firestore, activeId, (rows) => {
      setOrders(rows);
      setLoading(false);
    });
    return unsub;
  }, [activeId]);

  return { orders: activeId ? orders : [], loading: activeId ? loading : false };
}
