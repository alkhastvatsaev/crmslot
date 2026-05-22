import { applyTypeFilter } from "../crmActivityFilters";
import type { CrmActivityEvent } from "../crmActivityTypes";

const e = (type: CrmActivityEvent["type"]): CrmActivityEvent => ({
  id: type,
  type,
  ts: Date.now(),
});

describe("applyTypeFilter (chatbot & fournisseurs)", () => {
  const events = [
    e("supplier_order_lecot"),
    e("chatbot_email_sent"),
    e("chatbot_intervention_status"),
    e("intervention_created"),
  ];

  it("filtre fournisseurs inclut Lecot chatbot", () => {
    const out = applyTypeFilter(events, "suppliers");
    expect(out.map((x) => x.type)).toEqual(["supplier_order_lecot"]);
  });

  it("filtre communications inclut emails chatbot", () => {
    const out = applyTypeFilter(events, "communications");
    expect(out.map((x) => x.type)).toEqual(["chatbot_email_sent"]);
  });

  it("filtre interventions inclut statut chatbot", () => {
    const out = applyTypeFilter(events, "interventions");
    expect(out.map((x) => x.type)).toEqual([
      "chatbot_intervention_status",
      "intervention_created",
    ]);
  });

  it("filtre interventions inclut devis", () => {
    const withQuote = [
      ...events,
      e("quote_created"),
      e("quote_status_changed"),
    ];
    const out = applyTypeFilter(withQuote, "interventions");
    expect(out.map((x) => x.type)).toContain("quote_created");
  });
});
