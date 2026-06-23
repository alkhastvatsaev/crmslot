import { synthesizeIvanaChatEvents } from "@/features/crmHistory/synthesizeIvanaChatEvents";
import type { IvanaPortalChatDoc } from "@/features/backoffice";
import type { Intervention } from "@/features/interventions";

describe("synthesizeIvanaChatEvents", () => {
  it("maps staff chat to ivana_chat_message", () => {
    const msg: IvanaPortalChatDoc = {
      id: "m1",
      companyId: "co1",
      body: "Bonjour, nous passons demain matin.",
      role: "staff",
      senderUid: "disp-1",
      createdAt: "2024-02-01T10:00:00Z",
      interventionId: "iv1",
    };
    const iv: Intervention = {
      id: "iv1",
      title: "Serrure",
      address: "Rue A",
      time: "09:00",
      status: "assigned",
      location: { lat: 50, lng: 4 },
      clientName: "Martin",
    };
    const evts = synthesizeIvanaChatEvents([msg], new Map([["iv1", iv]]));
    expect(evts).toHaveLength(1);
    expect(evts[0].type).toBe("ivana_chat_message");
    expect(evts[0].chatRole).toBe("staff");
    expect(evts[0].note).toContain("demain");
  });
});
