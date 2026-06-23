"use client";

import { useEffect, useState } from "react";
import { firestore, isConfigured } from "@/core/config/firebase";
import {
  subscribePortalChatMessages,
  type PortalChatDoc,
} from "@/features/backoffice/portalChatFirestore";

export function useCompanyPortalChatFeed(companyId: string | null) {
  const [messages, setMessages] = useState<PortalChatDoc[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cid = (companyId ?? "").trim();
    if (!cid || !isConfigured || !firestore) {
      setMessages([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    const unsub = subscribePortalChatMessages(
      firestore,
      cid,
      (rows) => {
        setMessages(rows);
        setLoading(false);
      },
      () => {
        setMessages([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [companyId]);

  return { messages, loading };
}
