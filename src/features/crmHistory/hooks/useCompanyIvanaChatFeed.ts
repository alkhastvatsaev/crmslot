"use client";

import { useEffect, useState } from "react";
import { firestore, isConfigured } from "@/core/config/firebase";
import {
  subscribeIvanaPortalMessages,
  type IvanaPortalChatDoc,
} from "@/features/backoffice/ivanaChatFirestore";

export function useCompanyIvanaChatFeed(companyId: string | null) {
  const [messages, setMessages] = useState<IvanaPortalChatDoc[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cid = (companyId ?? "").trim();
    if (!cid || !isConfigured || !firestore) {
      setMessages([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    const unsub = subscribeIvanaPortalMessages(
      firestore,
      cid,
      (rows) => {
        setMessages(rows);
        setLoading(false);
      },
      () => {
        setMessages([]);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [companyId]);

  return { messages, loading };
}
