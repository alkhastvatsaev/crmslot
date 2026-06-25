import {
  crmHistoryEventDetailBody,
  crmHistoryEventLabel,
} from "@/features/crmHistory/crmHistoryEventLabel";

const t = (key: string) => {
  const dict: Record<string, string> = {
    "crmHistory.event.page_navigated": "Navigation page",
    "crmHistory.detail.body.page_navigated": "Un utilisateur a changé de page.",
  };
  return dict[key] ?? key;
};

describe("crmHistoryEventLabel", () => {
  it("returns translated label when key exists", () => {
    expect(crmHistoryEventLabel(t, "page_navigated")).toBe("Navigation page");
  });

  it("humanizes unknown event types instead of showing raw i18n keys", () => {
    expect(crmHistoryEventLabel(t, "unknown_event_type")).toBe("Unknown Event Type");
  });
});

describe("crmHistoryEventDetailBody", () => {
  it("returns detail body when key exists", () => {
    expect(crmHistoryEventDetailBody(t, "page_navigated")).toBe("Un utilisateur a changé de page.");
  });

  it("falls back to short label when detail body is missing", () => {
    expect(crmHistoryEventDetailBody(t, "intervention_viewed")).toBe("Intervention Viewed");
  });
});
