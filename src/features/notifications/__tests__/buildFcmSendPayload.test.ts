import { buildFcmSendPayload } from "@/features/notifications/buildFcmSendPayload";
import {
  ANDROID_PUSH_CHANNEL_CHAT,
  ANDROID_PUSH_CHANNEL_DEFAULT,
} from "@/features/notifications/androidPushChannels";
import { resolvePushNotificationOpenUrl } from "@/features/notifications/resolvePushNotificationOpenUrl";

describe("buildFcmSendPayload", () => {
  it("inclut webpush, apns et android pour livraison arrière-plan", () => {
    const payload = buildFcmSendPayload({
      title: "Test",
      body: "Corps",
      data: { type: "portal_chat", audience: "staff", companyId: "co1" },
      origin: "https://crmslot.vercel.app",
    });

    expect(payload.webpush?.notification?.title).toBe("Test");
    expect(payload.webpush?.fcmOptions?.link).toContain("bmBackofficeChat");
    expect(payload.apns?.payload?.aps?.alert).toEqual({ title: "Test", body: "Corps" });
    expect(payload.android?.notification?.channelId).toBe(ANDROID_PUSH_CHANNEL_CHAT);
    expect(payload.data?.url).toContain("bmBackofficeChat");
  });

  it("utilise le canal default hors chat", () => {
    const payload = buildFcmSendPayload({
      title: "Paiement",
      body: "OK",
      data: { type: "payment_received" },
      origin: "https://crmslot.vercel.app",
    });
    expect(payload.android?.notification?.channelId).toBe(ANDROID_PUSH_CHANNEL_DEFAULT);
  });
});

describe("resolvePushNotificationOpenUrl", () => {
  it("construit les deep-links client et staff", () => {
    expect(
      resolvePushNotificationOpenUrl("https://crmslot.vercel.app", {
        type: "portal_chat",
        audience: "client",
        interventionId: "iv1",
      })
    ).toContain("/m/demande?bmClientChat=iv1");

    expect(
      resolvePushNotificationOpenUrl("https://crmslot.vercel.app", {
        type: "portal_chat",
        audience: "staff",
        interventionId: "iv2",
      })
    ).toContain("bmBackofficeChat=iv2");
  });
});
