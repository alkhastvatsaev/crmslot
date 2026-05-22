"use client";

import { useEffect, useState } from "react";
import { firestore } from "@/core/config/firebase";
import {
  subscribeCompanyCommissionAudit,
  type CompanyCommissionAuditRow,
} from "@/features/commissions/commissionFirestore";

export function useCompanyCommissionsFeed(companyId: string | null) {
  const [rows, setRows] = useState<CompanyCommissionAuditRow[]>([]);
  const [loading, setLoading] = useState(Boolean(companyId));

  useEffect(() => {
    if (!companyId || !firestore) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeCompanyCommissionAudit(firestore, companyId, (r) => {
      setRows(r);
      setLoading(false);
    });
  }, [companyId]);

  return { rows, loading };
}
