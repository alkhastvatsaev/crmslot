import { applyPeriod, applySearch, applyTypeFilter, PERIOD_MS } from "../crmActivityFilters";
import type { CrmActivityEvent } from "../crmActivityTypes";

const makeEvent = (overrides: Partial<CrmActivityEvent> = {}): CrmActivityEvent => ({
  id: "e1",
  type: "intervention_created",
  ts: Date.now(),
  ...overrides,
});

// ---------------------------------------------------------------------------
// applyPeriod
// ---------------------------------------------------------------------------
describe("applyPeriod", () => {
  it("returns all events unchanged when period is 'all'", () => {
    const old = makeEvent({ ts: 1000 });
    expect(applyPeriod([old], "all")).toEqual([old]);
  });

  it("returns empty array for empty input", () => {
    expect(applyPeriod([], "week")).toHaveLength(0);
  });

  it("keeps event from 1 hour ago under 'today'", () => {
    const recent = makeEvent({ ts: Date.now() - 3_600_000 });
    expect(applyPeriod([recent], "today")).toContainEqual(recent);
  });

  it("drops event from 2 days ago under 'today'", () => {
    const old = makeEvent({ ts: Date.now() - 2 * PERIOD_MS.today });
    expect(applyPeriod([old], "today")).toHaveLength(0);
  });

  it("keeps event from 3 days ago under 'week'", () => {
    const recent = makeEvent({ ts: Date.now() - 3 * 86_400_000 });
    expect(applyPeriod([recent], "week")).toContainEqual(recent);
  });

  it("drops event from 8 days ago under 'week'", () => {
    const old = makeEvent({ ts: Date.now() - 8 * 86_400_000 });
    expect(applyPeriod([old], "week")).toHaveLength(0);
  });

  it("keeps event from 15 days ago under 'month'", () => {
    const recent = makeEvent({ ts: Date.now() - 15 * 86_400_000 });
    expect(applyPeriod([recent], "month")).toContainEqual(recent);
  });

  it("drops event from 31 days ago under 'month'", () => {
    const old = makeEvent({ ts: Date.now() - 31 * 86_400_000 });
    expect(applyPeriod([old], "month")).toHaveLength(0);
  });

  it("keeps event at exact cutoff boundary", () => {
    const cutoff = Date.now() - PERIOD_MS.today;
    const edge = makeEvent({ ts: cutoff });
    expect(applyPeriod([edge], "today")).toContainEqual(edge);
  });
});

// ---------------------------------------------------------------------------
// applyTypeFilter
// ---------------------------------------------------------------------------
describe("applyTypeFilter", () => {
  const EVENTS: CrmActivityEvent[] = [
    makeEvent({ id: "a", type: "intervention_created" }),
    makeEvent({ id: "b", type: "intervention_assigned" }),
    makeEvent({ id: "c", type: "intervention_status" }),
    makeEvent({ id: "d", type: "intervention_completed" }),
    makeEvent({ id: "e", type: "intervention_invoiced" }),
    makeEvent({ id: "f", type: "material_ordered" }),
    makeEvent({ id: "g", type: "supplier_ordered" }),
    makeEvent({ id: "h", type: "email_sent" }),
    makeEvent({ id: "i", type: "email_received" }),
    makeEvent({ id: "j", type: "commission_calculated" }),
  ];

  it("returns all 10 events for filter 'all'", () => {
    expect(applyTypeFilter(EVENTS, "all")).toHaveLength(10);
  });

  it("returns empty array for empty input", () => {
    expect(applyTypeFilter([], "interventions")).toHaveLength(0);
  });

  it("filters interventions — 5 types", () => {
    const result = applyTypeFilter(EVENTS, "interventions");
    expect(result).toHaveLength(5);
    expect(result.every((e) => e.type.startsWith("intervention_"))).toBe(true);
  });

  it("filters materials — bons matériel et commandes Lecot", () => {
    const withLecot = [...EVENTS, makeEvent({ id: "lecot1", type: "supplier_order_lecot" })];
    const result = applyTypeFilter(withLecot, "materials");
    expect(result.map((e) => e.type).sort()).toEqual(
      ["material_ordered", "supplier_order_lecot", "supplier_ordered"].sort(),
    );
  });

  it("filters suppliers — only supplier_ordered", () => {
    const result = applyTypeFilter(EVENTS, "suppliers");
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("supplier_ordered");
  });

  it("filters communications — email_sent + email_received + commission_calculated", () => {
    const result = applyTypeFilter(EVENTS, "communications");
    expect(result).toHaveLength(3);
    const types = result.map((e) => e.type).sort();
    expect(types).toEqual(["commission_calculated", "email_received", "email_sent"]);
  });
});

// ---------------------------------------------------------------------------
// applySearch
// ---------------------------------------------------------------------------
describe("applySearch", () => {
  const EVENTS: CrmActivityEvent[] = [
    makeEvent({ id: "a", clientName: "Dupont SA", interventionTitle: "Serrure bloquée" }),
    makeEvent({ id: "b", address: "Rue de la Loi 16, Bruxelles" }),
    makeEvent({ id: "c", orderLabel: "2× Cylindre 50mm" }),
    makeEvent({ id: "d", emailSubject: "Confirmation de rendez-vous" }),
    makeEvent({ id: "e", emailFrom: "client@example.com" }),
  ];

  it("returns all events for empty query", () => {
    expect(applySearch(EVENTS, "")).toHaveLength(5);
  });

  it("returns all events for whitespace-only query", () => {
    expect(applySearch(EVENTS, "   ")).toHaveLength(5);
  });

  it("matches by clientName case-insensitively", () => {
    const r = applySearch(EVENTS, "DUPONT");
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe("a");
  });

  it("matches by interventionTitle", () => {
    const r = applySearch(EVENTS, "serrure");
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe("a");
  });

  it("matches by address", () => {
    const r = applySearch(EVENTS, "bruxelles");
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe("b");
  });

  it("matches by orderLabel", () => {
    const r = applySearch(EVENTS, "cylindre");
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe("c");
  });

  it("matches by emailSubject", () => {
    const r = applySearch(EVENTS, "confirmation");
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe("d");
  });

  it("matches by emailFrom", () => {
    const r = applySearch(EVENTS, "example.com");
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe("e");
  });

  it("returns empty array when no match", () => {
    expect(applySearch(EVENTS, "xyznotfound")).toHaveLength(0);
  });

  it("returns empty array for empty events", () => {
    expect(applySearch([], "dupont")).toHaveLength(0);
  });

  it("partial match works mid-string", () => {
    const r = applySearch(EVENTS, "50mm");
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe("c");
  });
});
