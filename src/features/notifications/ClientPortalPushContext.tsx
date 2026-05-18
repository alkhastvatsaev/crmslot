"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  useClientPortalPushMessaging,
  type ClientPortalPushApi,
} from "@/features/notifications/useClientPortalPushMessaging";

const ClientPortalPushContext = createContext<ClientPortalPushApi | null>(null);

export function ClientPortalPushProvider({ children }: { children: ReactNode }) {
  const api = useClientPortalPushMessaging(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY);
  return <ClientPortalPushContext.Provider value={api}>{children}</ClientPortalPushContext.Provider>;
}

export function useClientPortalPush(): ClientPortalPushApi {
  const ctx = useContext(ClientPortalPushContext);
  if (!ctx) {
    throw new Error("useClientPortalPush must be used within ClientPortalPushProvider");
  }
  return ctx;
}
