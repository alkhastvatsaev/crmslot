"use client";

import { useEffect, useState } from "react";
import { firestore } from "@/core/config/firebase";
import { subscribeSupplierOrders } from "@/features/suppliers/supplierFirestore";
import type { SupplierOrder } from "@/features/suppliers/types";

/** Commandes fournisseur (Lecot, etc.) — temps réel. */
export function useCompanySupplierOrdersRecent(companyId: string | null) {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [loading, setLoading] = useState(Boolean(companyId));

  useEffect(() => {
    if (!companyId || !firestore) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeSupplierOrders(firestore, companyId, (rows) => {
      setOrders(rows);
      setLoading(false);
    });
  }, [companyId]);

  return { orders, loading };
}
