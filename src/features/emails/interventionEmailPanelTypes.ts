export type InterventionEmailComposeState = {
  to: string;
  subject: string;
  bodyText: string;
  inReplyTo?: string;
  references?: string;
};

export const EMPTY_INTERVENTION_EMAIL_COMPOSE: InterventionEmailComposeState = {
  to: "",
  subject: "",
  bodyText: "",
};

export type InterventionEmailPanelVariant = "default" | "patron";

export type InterventionEmailPatronView = "thread" | "compose";
