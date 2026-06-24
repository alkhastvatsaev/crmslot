/// <reference lib="webworker" />

import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";
import {
  firebasePublicConfig,
  isFirebasePublicConfigured,
} from "../src/features/notifications/firebasePublicConfig";
import { resolvePushNotificationOpenUrl } from "../src/features/notifications/resolvePushNotificationOpenUrl";

declare let self: ServiceWorkerGlobalScope;

function bootMessaging(): void {
  if (!isFirebasePublicConfigured()) return;

  const app = initializeApp(firebasePublicConfig as FirebaseOptions);
  const messaging = getMessaging(app);

  onBackgroundMessage(messaging, (payload) => {
    const data = (payload.data ?? {}) as Record<string, string | undefined>;
    const title = payload.notification?.title ?? data.title ?? "CRMSLOT";
    const body = payload.notification?.body ?? data.body ?? "";
    const origin = self.location.origin;
    const openUrl = resolvePushNotificationOpenUrl(origin, data);
    const pushType = typeof data.type === "string" ? data.type : "";
    const interventionId = typeof data.interventionId === "string" ? data.interventionId : "";
    let tag = "technician-reminder";

    if (pushType === "portal_chat") {
      const audience = typeof data.audience === "string" ? data.audience : "staff";
      if (audience === "client") {
        const chatIv = interventionId.length > 0 ? interventionId : "open";
        tag = `client-portal-chat-${chatIv}`;
      } else {
        const chatIv = interventionId.length > 0 ? interventionId : "global";
        tag = `portal-chat-${chatIv}`;
      }
    } else if (interventionId.length > 0) {
      tag = `case-${interventionId}`;
    }

    void self.registration.showNotification(title, {
      body,
      data: { ...data, url: openUrl },
      tag,
      icon: `${origin}/icon-192.png`,
      badge: `${origin}/icon-192.png`,
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
