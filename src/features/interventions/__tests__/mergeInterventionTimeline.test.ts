import {
  commissionAuditToInterventionEvent,
  emailToInterventionEvent,
  materialOrderToInterventionEvent,
  mergeInterventionTimelineEvents,
  portalChatToInterventionEvent,
  statusEventToInterventionEvent,
} from "@/features/interventions/timeline/mergeInterventionTimeline";
import type { InterventionStatusEvent } from "@/features/interventions/workflow/interventionWorkflowTypes";

describe("mergeInterventionTimeline", () => {
  const statusEv: InterventionStatusEvent = {
    id: "s1",
    interventionId: "iv-1",
    fromStatus: "pending",
    toStatus: "assigned",
    actorUid: "dispatch-1",
    actorRole: "dispatcher",
    note: null,
    at: "2026-05-17T08:00:00.000Z",
    companyId: "co-1",
  };

  it("maps status events and sorts chronologically", () => {
    const merged = mergeInterventionTimelineEvents(
      [statusEv],
      [
        {
          id: "c1",
          data: {
            interventionId: "iv-1",
            type: "comment",
            content: "Client préfère l'après-midi",
            visibility: "internal",
            createdAt: "2026-05-17T09:00:00.000Z",
            createdByUid: "staff-1",
          },
        },
      ],
    );
    expect(merged).toHaveLength(2);
    expect(merged[0].type).toBe("status_change");
    expect(merged[1].type).toBe("comment");
    expect(merged[1].content).toContain("après-midi");
  });

  it("filters client-visible only", () => {
    const merged = mergeInterventionTimelineEvents(
      [statusEv],
      [
        {
          id: "c-internal",
          data: {
            interventionId: "iv-1",
            type: "comment",
            content: "Secret dispatch",
            visibility: "internal",
            createdAt: "2026-05-17T10:00:00.000Z",
            createdByUid: "staff-1",
          },
        },
        {
          id: "c-client",
          data: {
            interventionId: "iv-1",
            type: "comment",
            content: "Visible client",
            visibility: "client",
            createdAt: "2026-05-17T11:00:00.000Z",
            createdByUid: "staff-1",
          },
        },
      ],
      { clientVisibleOnly: true },
    );
    expect(merged.some((e) => e.content === "Secret dispatch")).toBe(false);
    expect(merged.some((e) => e.content === "Visible client")).toBe(true);
    expect(merged.some((e) => e.type === "status_change")).toBe(true);
  });

  it("statusEventToInterventionEvent carries actor role", () => {
    const row = statusEventToInterventionEvent(statusEv);
    expect(row.actorRole).toBe("dispatcher");
    expect(row.newStatus).toBe("assigned");
  });

  it("merges emails and material orders chronologically", () => {
    const merged = mergeInterventionTimelineEvents([], [], {
      emails: [
        {
          id: "e1",
          interventionId: "iv-1",
          companyId: "co-1",
          direction: "inbound",
          from: "supplier@example.com",
          to: "support+iv-1@example.com",
          subject: "Pièce reçue",
          bodyText: "Le fournisseur confirme.",
          messageId: "<e1@example.com>",
          createdAt: "2026-05-17T12:00:00.000Z",
        },
      ],
      materialOrders: [
        {
          id: "m1",
          interventionId: "iv-1",
          technicianUid: "tech-1",
          partsRequested: [{ description: "Cylindre", quantity: 1 }],
          urgency: "normal",
          status: "ordered",
          createdAt: "2026-05-17T11:00:00.000Z",
          updatedAt: "2026-05-17T11:00:00.000Z",
        },
      ],
    });
    expect(merged).toHaveLength(2);
    expect(merged[0].type).toBe("material_order");
    expect(merged[1].type).toBe("email");
    expect(emailToInterventionEvent({
      id: "e1",
      interventionId: "iv-1",
      companyId: "co-1",
      direction: "outbound",
      from: "office@example.com",
      to: "client@example.com",
      subject: "Test",
      bodyText: "Corps",
      messageId: "<e1@example.com>",
      createdAt: "2026-05-17T08:00:00.000Z",
      sentByUid: "staff-1",
    }).content).toContain("→");
    expect(materialOrderToInterventionEvent({
      id: "m1",
      interventionId: "iv-1",
      technicianUid: "tech-1",
      partsRequested: [{ description: "Serrure", quantity: 2 }],
      urgency: "high",
      status: "pending",
      createdAt: "2026-05-17T08:00:00.000Z",
      updatedAt: "2026-05-17T08:00:00.000Z",
    }).content).toContain("(pending)");
  });

  it("merges commission audit entries", () => {
    const audit = {
      id: "a1",
      interventionId: "iv-1",
      action: "override",
      finalCommissionAmount: 42.5,
      reason: "Bonus",
      byUid: "admin-1",
      at: "2026-05-17T13:00:00.000Z",
    };
    const merged = mergeInterventionTimelineEvents([], [], { commissionAudit: [audit] });
    expect(merged).toHaveLength(1);
    expect(merged[0].type).toBe("commission");
    expect(merged[0].content).toContain("42.50");
    expect(merged[0].content).toContain("Bonus");
    expect(commissionAuditToInterventionEvent(audit, "iv-1").type).toBe("commission");
    const calculated = commissionAuditToInterventionEvent(
      { ...audit, id: "a2", action: "calculated", reason: undefined },
      "iv-1",
    );
    expect(calculated.content).toContain("Calcul automatique");
  });

  it("excludes commission from client-visible feed", () => {
    const merged = mergeInterventionTimelineEvents([], [], {
      clientVisibleOnly: true,
      commissionAudit: [
        {
          id: "a1",
          interventionId: "iv-1",
          action: "override",
          finalCommissionAmount: 10,
          byUid: "admin-1",
          at: "2026-05-17T13:00:00.000Z",
        },
      ],
    });
    expect(merged).toHaveLength(0);
  });

  it("excludes emails and material orders from client-visible feed", () => {
    const merged = mergeInterventionTimelineEvents(
      [statusEv],
      [],
      {
        clientVisibleOnly: true,
        emails: [
          {
            id: "e1",
            interventionId: "iv-1",
            companyId: "co-1",
            direction: "inbound",
            from: "client@example.com",
            to: "support+iv-1@example.com",
            subject: "Secret",
            bodyText: "Interne",
            messageId: "<e1@example.com>",
            createdAt: "2026-05-17T12:00:00.000Z",
          },
        ],
        materialOrders: [
          {
            id: "m1",
            interventionId: "iv-1",
            technicianUid: "tech-1",
            partsRequested: [{ description: "X", quantity: 1 }],
            urgency: "normal",
            status: "pending",
            createdAt: "2026-05-17T11:00:00.000Z",
            updatedAt: "2026-05-17T11:00:00.000Z",
          },
        ],
      },
    );
    expect(merged.every((e) => e.type !== "email" && e.type !== "material_order")).toBe(true);
  });

  it("merges portal chat and shows in client-visible feed", () => {
    const chat = portalChatToInterventionEvent({
      id: "pc1",
      companyId: "co-1",
      interventionId: "iv-1",
      body: "Bonjour",
      role: "client",
      senderUid: "client-1",
      createdAt: "2026-05-17T14:00:00.000Z",
    });
    expect(chat.type).toBe("portal_chat");

    const merged = mergeInterventionTimelineEvents([], [], {
      clientVisibleOnly: true,
      portalChat: [
        {
          id: "pc1",
          companyId: "co-1",
          interventionId: "iv-1",
          body: "Bonjour",
          role: "client",
          senderUid: "client-1",
          createdAt: "2026-05-17T14:00:00.000Z",
        },
      ],
    });
    expect(merged.some((e) => e.type === "portal_chat" && e.content?.includes("Bonjour"))).toBe(true);
  });
});
