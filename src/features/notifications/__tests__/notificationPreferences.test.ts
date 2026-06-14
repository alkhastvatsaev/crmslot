import {
  channelAllowed,
  normalizeNotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from "../notificationPreferences";

describe("notificationPreferences", () => {
  it("normalise les booléens connus", () => {
    const prefs = normalizeNotificationPreferences({ email: false, sms: true, foo: true });
    expect(prefs.email).toBe(false);
    expect(prefs.sms).toBe(true);
    expect(prefs.push).toBe(true);
  });

  it("retourne les défauts si valeur invalide", () => {
    expect(normalizeNotificationPreferences(null)).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
  });

  it("channelAllowed respecte opt-out", () => {
    expect(channelAllowed({ email: false }, "email")).toBe(false);
    expect(channelAllowed({ email: false }, "sms")).toBe(true);
    expect(channelAllowed(null, "whatsapp")).toBe(true);
  });
});
