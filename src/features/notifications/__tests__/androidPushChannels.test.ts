import {
  ANDROID_PUSH_CHANNEL_CHAT,
  ANDROID_PUSH_CHANNEL_DEFAULT,
  ANDROID_PUSH_CHANNEL_OPERATIONS,
  resolveAndroidPushChannelId,
} from "@/features/notifications/androidPushChannels";
import { resolveNativePushAudience } from "@/features/notifications/resolveNativePushAudience";

describe("resolveAndroidPushChannelId", () => {
  it("route le chat vers le canal chat", () => {
    expect(resolveAndroidPushChannelId({ type: "portal_chat" })).toBe(ANDROID_PUSH_CHANNEL_CHAT);
  });

  it("route les missions vers le canal operations", () => {
    expect(resolveAndroidPushChannelId({ type: "assignment" })).toBe(
      ANDROID_PUSH_CHANNEL_OPERATIONS
    );
    expect(resolveAndroidPushChannelId({ type: "reminder" })).toBe(ANDROID_PUSH_CHANNEL_OPERATIONS);
  });

  it("utilise default pour le reste", () => {
    expect(resolveAndroidPushChannelId({ type: "payment_received" })).toBe(
      ANDROID_PUSH_CHANNEL_DEFAULT
    );
    expect(resolveAndroidPushChannelId()).toBe(ANDROID_PUSH_CHANNEL_DEFAULT);
  });
});

describe("resolveNativePushAudience", () => {
  it("détecte client, technicien et admin", () => {
    expect(resolveNativePushAudience("/m/demande")).toBe("client");
    expect(resolveNativePushAudience("/m/demande/foo")).toBe("client");
    expect(resolveNativePushAudience("/m/technician")).toBe("technician");
    expect(resolveNativePushAudience("/")).toBe("backoffice");
    expect(resolveNativePushAudience("/map")).toBe("backoffice");
  });
});
