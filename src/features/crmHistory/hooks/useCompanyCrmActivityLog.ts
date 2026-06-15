"use client";

import { useEffect, useState } from "react";
import { logger } from "@/core/logger";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { isDemoTenantCompanyId } from "@/core/config/demoTenantFirestore";
import { firestore, isConfigured } from "@/core/config/firebase";
import { isFirestorePermissionDenied } from "@/core/firestore/firestoreClientErrors";
import type { CompanyCrmActivityDoc } from "../crmActivityLog";

const CRM_ACTIVITY_LIMIT = 2000;

export function useCompanyCrmActivityLog(companyId: string | null) {
  const [rows, setRows] = useState<Array<CompanyCrmActivityDoc & { id: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cid = (companyId ?? "").trim();
    if (!cid || !isConfigured || !firestore || isDemoTenantCompanyId(cid)) {
      setRows([]);
      setLoading(false);
      setError(null);
      return () => {};
    }

    setLoading(true);
    setError(null);
    const q = query(
      collection(firestore, "companies", cid, "crm_activity"),
      orderBy("at", "desc"),
      limit(CRM_ACTIVITY_LIMIT)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setRows(
          snap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as CompanyCrmActivityDoc & { id: string }
          )
        );
        setError(null);
        setLoading(false);
      },
      (e) => {
        if (isFirestorePermissionDenied(e)) {
          logger.warn("[useCompanyCrmActivityLog] permission denied — journal ignoré", {
            error: e instanceof Error ? e.message : String(e),
          });
          setError(null);
          setRows([]);
        } else {
          logger.warn("[useCompanyCrmActivityLog]", {
            error: e instanceof Error ? e.message : String(e),
          });
          setError(e instanceof Error ? e.message : "Erreur journal CRM");
          setRows([]);
        }
        setLoading(false);
      }
    );

    return () => unsub();
  }, [companyId]);

  return { rows, loading, error };
}
