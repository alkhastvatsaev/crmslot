import {
  buildNotificationPayloads,
  dispatchStatusNotifications,
} from "@/features/notifications/dispatchStatusNotifications";

jest.mock("@/core/api/fetchWithAuth", () => ({
  fetchWithAuth: jest.fn().mockResolvedValue({ ok: true }),
}));

import { fetchWithAuth } from "@/core/api/fetchWithAuth";

const baseIntervention = {
  id: "iv-wa-1",
  clientName: "Jean Dupont",
  clientFirstName: "Jean",
  clientLastName: "Dupont",
  clientPhone: "+32470000000",
  address: "Rue de la Loi 1, Bruxelles",
  title: "Ouverture de porte",
  scheduledDate: "2026-06-10",
  scheduledTime: "10:00",
};

describe("WhatsApp status notifications", () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = realFetch;
    delete process.env.NEXT_PUBLIC_FF_WHATSAPP;
  });

  it("builds a whatsapp payload with clientPhone for en_route", () => {
    const payloads = buildNotificationPayloads({
      fromStatus: "assigned",
      toStatus: "en_route",
      intervention: baseIntervention,
    });
    const wa = payloads.filter((p) => p.channel === "whatsapp");
    expect(wa).toHaveLength(1);
    expect(wa[0]?.variables.clientPhone).toBe("+32470000000");
  });

  it("posts to /api/notifications/whatsapp when flag is on", async () => {
    process.env.NEXT_PUBLIC_FF_WHATSAPP = "true";
    await dispatchStatusNotifications({
      fromStatus: "assigned",
      toStatus: "en_route",
      intervention: baseIntervention,
    });
    expect(fetchWithAuth).toHaveBeenCalledWith(
      "/api/notifications/whatsapp",
      expect.objectContaining({ method: "POST" })
    );
    const body = JSON.parse((fetchWithAuth as jest.Mock).mock.calls[0][1].body as string) as Record<
      string,
      string
    >;
    expect(body.to).toBe("+32470000000");
    expect(body.interventionStatus).toBe("en_route");
  });

  it("skips whatsapp channel when flag is off", async () => {
    process.env.NEXT_PUBLIC_FF_WHATSAPP = "false";
    await dispatchStatusNotifications({
      fromStatus: "assigned",
      toStatus: "en_route",
      intervention: baseIntervention,
    });
    expect(fetchWithAuth).not.toHaveBeenCalled();
    // Le canal email continue de partir vers /api/notifications/send
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/notifications/send",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("skips whatsapp when client has no phone", async () => {
    process.env.NEXT_PUBLIC_FF_WHATSAPP = "true";
    await dispatchStatusNotifications({
      fromStatus: "assigned",
      toStatus: "en_route",
      intervention: { ...baseIntervention, clientPhone: undefined },
    });
    expect(fetchWithAuth).not.toHaveBeenCalled();
  });
});
