import { signWebhookPayload, endpointSubscribed } from "../dispatchOutboundWebhook";
import type { WebhookEndpoint } from "../types";

describe("dispatchOutboundWebhook", () => {
  it("signe le payload de façon déterministe", () => {
    const sig = signWebhookPayload("secret", '{"a":1}');
    expect(sig).toHaveLength(64);
    expect(signWebhookPayload("secret", '{"a":1}')).toBe(sig);
  });

  it("endpointSubscribed filtre événements", () => {
    const ep: WebhookEndpoint = {
      id: "1",
      companyId: "c1",
      url: "https://example.com",
      secret: "s",
      events: ["intervention.invoiced"],
      isActive: true,
      createdAt: "2026-01-01",
    };
    expect(endpointSubscribed(ep, "intervention.invoiced")).toBe(true);
    expect(endpointSubscribed(ep, "intervention.status_changed")).toBe(false);
    expect(endpointSubscribed({ ...ep, isActive: false }, "intervention.invoiced")).toBe(false);
  });
});
