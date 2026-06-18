/// <reference lib="webworker" />

import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";
import {
  firebasePublicConfig,
  isFirebasePublicConfigured,
} from "../src/features/notifications/firebasePublicConfig";
import {
  BM_TECH_CASE_PARAM,
  BM_TECH_REMINDER_PARAM,
  BM_BACKOFFICE_CHAT_PARAM,
} from "../src/features/notifications/notificationConstants";
import { parseTechnicianNotificationSearchParams } from "../src/features/notifications/technicianNotificationUrls";

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
      const chatIv = interventionId.length > 0 ? interventionId : "global";
      openUrl = `${origin}/?${BM_BACKOFFICE_CHAT_PARAM}=${encodeURIComponent(chatIv)}`;
      tag = `portal-chat-${chatIv}`;
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
  const rawUrl =
    typeof event.notification.data?.url === "string"
      ? event.notification.data.url
      : `${self.location.origin}/`;

  let targetUrl = rawUrl;
  try {
    const u = new URL(rawUrl, self.location.origin);
    const intent = parseTechnicianNotificationSearchParams(u.searchParams);
    if (intent.kind === "case") {
      targetUrl = `${self.location.origin}/?${BM_TECH_CASE_PARAM}=${encodeURIComponent(intent.caseId)}`;
    } else if (intent.kind === "reminder") {
      targetUrl = `${self.location.origin}/?${BM_TECH_REMINDER_PARAM}=1`;
    }
  } catch {
    /* garde rawUrl */
  }

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
