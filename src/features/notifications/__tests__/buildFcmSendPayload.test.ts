import {
  buildFcmNativePushPayload,
  buildFcmPayloadForPlatform,
  buildFcmWebDataOnlyPayload,
  normalizeFcmTokenPlatform,
} from "@/features/notifications/buildFcmSendPayload";
import {
  ANDROID_PUSH_CHANNEL_CHAT,
  ANDROID_PUSH_CHANNEL_DEFAULT,
} from "@/features/notifications/androidPushChannels";
import { resolvePushNotificationOpenUrl } from "@/features/notifications/resolvePushNotificationOpenUrl";

describe("buildFcmWebDataOnlyPayload", () => {
  it("n’inclut pas notification (iOS PWA arrière-plan)", () => {
    const payload = buildFcmWebDataOnlyPayload({
      title: "Test",
      body: "Corps",
      data: { type: "portal_chat", audience: "staff" },
      origin: "https://crmslot.vercel.app",
    });
    expect(payload.notification).toBeUndefined();
    expect(payload.webpush?.notification).toBeUndefined();
    expect(payload.data?.title).toBe("Test");
    expect(payload.data?.body).toBe("Corps");
    expect(payload.webpush?.fcmOptions?.link).toContain("bmBackofficeChat");
  });
});

describe("buildFcmNativePushPayload", () => {
  it("inclut notification pour affichage OS natif", () => {
    const payload = buildFcmNativePushPayload({
      title: "Mission",
      body: "Nouvelle",
      data: { type: "payment_received" },
      origin: "https://crmslot.vercel.app",
    });
    expect(payload.notification?.title).toBe("Mission");
    expect(payload.android?.notification?.channelId).toBe(ANDROID_PUSH_CHANNEL_DEFAULT);
  });
});

describe("buildFcmPayloadForPlatform", () => {
  it("route web vs android", () => {
    const web = buildFcmPayloadForPlatform("web", {
      title: "Chat",
      body: "Hi",
      data: { type: "portal_chat" },
      origin: "https://crmslot.vercel.app",
    });
    const android = buildFcmPayloadForPlatform("android", {
      title: "Chat",
      body: "Hi",
      data: { type: "portal_chat" },
      origin: "https://crmslot.vercel.app",
    });
    expect(web.notification).toBeUndefined();
    expect(android.notification?.title).toBe("Chat");
    expect(android.android?.notification?.channelId).toBe(ANDROID_PUSH_CHANNEL_CHAT);
  });
});

describe("normalizeFcmTokenPlatform", () => {
  it("normalise les plateformes", () => {
    expect(normalizeFcmTokenPlatform("android")).toBe("android");
    expect(normalizeFcmTokenPlatform("ios")).toBe("ios");
    expect(normalizeFcmTokenPlatform("web")).toBe("web");
    expect(normalizeFcmTokenPlatform(undefined)).toBe("web");
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
  });
});
