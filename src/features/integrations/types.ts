export type WebhookEventType =
  | "intervention.status_changed"
  | "intervention.invoiced"
  | "intervention.payment_received";

export type WebhookEndpoint = {
  id: string;
  companyId: string;
  url: string;
  secret: string;
  events: WebhookEventType[];
  isActive: boolean;
  createdAt: string;
};

export type OutboundWebhookPayload = {
  event: WebhookEventType;
  companyId: string;
  interventionId: string;
  at: string;
  data: Record<string, unknown>;
};
