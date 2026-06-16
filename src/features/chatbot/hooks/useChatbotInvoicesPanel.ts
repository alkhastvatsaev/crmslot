"use client";

import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, query, where, type Firestore } from "firebase/firestore";
import { firestore } from "@/core/config/firebase";
import {
  buildChatbotInvoiceRows,
  type ChatbotInvoiceRow,
} from "@/features/chatbot/chatbotInvoiceRows";
import type { Intervention } from "@/features/interventions/types";

export function useChatbotInvoicesPanel(companyId: string | null, enabled: boolean) {
  const [invoices, setInvoices] = useState<ChatbotInvoiceRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !companyId || !firestore) {
      setInvoices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const db = firestore as Firestore;
    const q = query(
      collection(db, "interventions"),
      where("companyId", "==", companyId),
      limit(80)
    );

    return onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Intervention);
        setInvoices(buildChatbotInvoiceRows(rows).slice(0, 40));
        setLoading(false);
      },
      () => {
        setInvoices([]);
        setLoading(false);
      }
    );
  }, [companyId, enabled]);

  return { invoices, loading };
}
