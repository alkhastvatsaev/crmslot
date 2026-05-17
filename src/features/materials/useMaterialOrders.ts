"use client";

import { useEffect, useState } from "react";
import { firestore } from "@/core/config/firebase";
import {
  subscribeMaterialOrders,
  type MaterialOrderDoc,
} from "@/features/materials/materialOrderFirestore";

export function useMaterialOrders(interventionId: string | null) {
  const [orders, setOrders] = useState<MaterialOrderDoc[]>([]);
  const [loading, setLoading] = useState(Boolean(interventionId));

  useEffect(() => {
    if (!interventionId || !firestore) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeMaterialOrders(firestore, interventionId, (rows) => {
      setOrders(rows);
      setLoading(false);
    });
    return unsub;
  }, [interventionId]);

  return { orders, loading };
}
