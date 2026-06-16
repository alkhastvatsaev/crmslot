"use client";

import { useEffect, useState } from "react";
import { firestore } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { subscribeSupplierOrders } from "@/features/suppliers/supplierFirestore";
import type { SupplierOrder } from "@/features/suppliers/types";

/** Commandes fournisseur (Lecot, etc.) — temps réel. */
export function useCompanySupplierOrdersRecent(companyId: string | null) {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [loading, setLoading] = useState(Boolean(companyId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId || !firestore) {
      setOrders([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    return subscribeSupplierOrders(
      firestore,
      companyId,
      (rows) => {
        setOrders(rows);
        setLoading(false);
        setError(null);
      },
      (message) => {
        const permissionDenied =
          typeof message === "string" && /insufficient permissions/i.test(message);
        if (permissionDenied) {
          logger.warn("[useCompanySupplierOrdersRecent] permission denied — commandes ignorées");
          setError(null);
        } else {
          logger.warn("[useCompanySupplierOrdersRecent]", { error: message });
          setError(message);
        }
        setOrders([]);
        setLoading(false);
      }
    );
  }, [companyId]);

  return { orders, loading, error };
}
