/// <reference lib="webworker" />

import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";
import {
  firebasePublicConfig,
  isFirebasePublicConfigured,
} from "../src/features/notifications/firebasePublicConfig";
import {
  BM_BACKOFFICE_CHAT_PARAM,
  BM_CLIENT_CHAT_PARAM,
  BM_TECH_CASE_PARAM,
  BM_TECH_REMINDER_PARAM,
} from "../src/features/notifications/notificationConstants";

declare let self: ServiceWorkerGlobalScope;

function bootMessaging(): void {
  if (!isFirebasePublicConfigured()) return;

  const app = initializeApp(firebasePublicConfig as FirebaseOptions);
  const messaging = getMessaging(app);

  onBackgroundMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? "CRMSLOT";
    const body = payload.notification?.body ?? "";
    const data = payload.data ?? {};

    const origin = self.location.origin;
    const pushType = typeof data.type === "string" ? data.type : "";
    const interventionId = typeof data.interventionId === "string" ? data.interventionId : "";
    let openUrl = `${origin}/`;
    let tag = "technician-reminder";

    if (pushType === "portal_chat") {
      const audience = typeof data.audience === "string" ? data.audience : "staff";
      if (audience === "client") {
        const chatIv = interventionId.length > 0 ? interventionId : "open";
        openUrl = `${origin}/m/demande?${BM_CLIENT_CHAT_PARAM}=${encodeURIComponent(chatIv)}`;
        tag = `client-portal-chat-${chatIv}`;
      } else {
        const chatIv = interventionId.length > 0 ? interventionId : "global";
        openUrl = `${origin}/?${BM_BACKOFFICE_CHAT_PARAM}=${encodeURIComponent(chatIv)}`;
        tag = `portal-chat-${chatIv}`;
      }
    } else if (interventionId.length > 0) {
      openUrl = `${origin}/?${BM_TECH_CASE_PARAM}=${encodeURIComponent(interventionId)}`;
      tag = `case-${interventionId}`;
    } else {
      openUrl = `${origin}/?${BM_TECH_REMINDER_PARAM}=1`;
    }
    void self.registration.showNotification(title, {
      body,
      data: { ...data, url: openUrl },
      tag,
    });
  });
}

bootMessaging();

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl =
    typeof event.notification.data?.url === "string"
      ? event.notification.data.url
      : `${self.location.origin}/`;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((c) => c.url.startsWith(self.location.origin)) as
        | WindowClient
        | undefined;
      if (existing?.navigate) {
        return existing.navigate(targetUrl).then(() => existing.focus());
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
