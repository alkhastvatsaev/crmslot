import { INBOX_TYPE_ICONS, type InboxNotificationType } from "../types";
import { buildNotification } from "../inboxFirestore";

const ALL_TYPES: InboxNotificationType[] = [
  "intervention_assigned",
  "intervention_status_changed",
  "sla_warning",
  "sla_breach",
  "maintenance_due",
  "quote_responded",
  "stock_low",
  "claim_opened",
  "system",
];

describe("INBOX_TYPE_ICONS", () => {
  it("has an icon for every notification type", () => {
    for (const type of ALL_TYPES) {
      expect(INBOX_TYPE_ICONS[type]).toBeTruthy();
    }
  });

  it("sla_breach uses 🚨", () => {
    expect(INBOX_TYPE_ICONS.sla_breach).toBe("🚨");
  });
});

describe("buildNotification", () => {
  it("sets required fields", () => {
    const n = buildNotification("uid1", "system", "Test", "Body");
    expect(n.recipientUid).toBe("uid1");
    expect(n.type).toBe("system");
    expect(n.title).toBe("Test");
    expect(n.body).toBe("Body");
  });

  it("accepts optional actionPath and interventionId", () => {
    const n = buildNotification("uid1", "sla_warning", "SLA!", "Urgent", {
      actionPath: "/interventions/iv1",
      interventionId: "iv1",
    });
    expect(n.actionPath).toBe("/interventions/iv1");
    expect(n.interventionId).toBe("iv1");
  });

  it("does not include id, companyId, read, createdAt", () => {
    const n = buildNotification("uid1", "system", "T", "B");
    expect("id" in n).toBe(false);
    expect("read" in n).toBe(false);
    expect("createdAt" in n).toBe(false);
  });
});
