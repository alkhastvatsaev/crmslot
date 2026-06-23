"use client";

import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { firestore } from "@/core/config/firebase";
import { INTERVENTION_EMAILS_COLLECTION } from "@/features/emails/interventionEmailFirestore";
import type { InterventionEmailDoc } from "@/features/emails";

const FEED_LIMIT = 300;

export function useCompanyEmailsFeed(companyId: string | null) {
  const [emails, setEmails] = useState<InterventionEmailDoc[]>([]);
  const [loading, setLoading] = useState(Boolean(companyId));

  useEffect(() => {
    if (!companyId || !firestore) {
      setEmails([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(firestore, INTERVENTION_EMAILS_COLLECTION),
      where("companyId", "==", companyId),
      orderBy("createdAt", "desc"),
      limit(FEED_LIMIT)
    );
    return onSnapshot(
      q,
      (snap) => {
        setEmails(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<InterventionEmailDoc, "id">) }))
        );
        setLoading(false);
      },
      () => {
        setEmails([]);
        setLoading(false);
      }
    );
  }, [companyId]);

  return { emails, loading };
}
