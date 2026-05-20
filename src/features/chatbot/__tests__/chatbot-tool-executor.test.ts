import { executeChatbotTool } from "@/features/chatbot/chatbot-tool-executor";
import {
  CHATBOT_TEST_CRM_CLIENT,
  chatbotTestInterventionRows,
} from "@/features/chatbot/testFixtures/chatbotWorkspaceSnapshot";

const mockFetchInterventions = jest.fn();
const mockClientsGet = jest.fn();
const mockQuotesGet = jest.fn();
const mockTechniciansGet = jest.fn();
const mockStockGet = jest.fn();
const mockClientDocGet = jest.fn();
const mockClientDocUpdate = jest.fn();
const mockInterventionDocGet = jest.fn();
const mockMaterialOrdersGet = jest.fn();
const mockTimelineGet = jest.fn();
const mockTimelineAdd = jest.fn();
const mockInterventionUpdate = jest.fn();
const mockSitesGet = jest.fn();
const mockSendInterventionEmail = jest.fn();

function emptySnap() {
  return { docs: [], empty: true, size: 0 };
}

function snapFrom(rows: Array<{ id: string; data: Record<string, unknown> }>) {
  return {
    docs: rows.map((row) => ({
      id: row.id,
      data: () => row.data,
      ref: { path: `mock/${row.id}` },
    })),
    empty: rows.length === 0,
    size: rows.length,
  };
}

/** Chaîne Firestore fluide : where / limit / orderBy → get. */
function chainQuery(getHandler: jest.Mock) {
  const chain = {
    where: () => chain,
    limit: () => chain,
    orderBy: () => chain,
    get: getHandler,
  };
  return chain;
}

function interventionTimelineCollection() {
  return {
    ...chainQuery(mockTimelineGet),
    add: mockTimelineAdd,
  };
}

function interventionDocRef(id: string) {
  return {
    get: () => mockInterventionDocGet(id),
    update: (patch: unknown) => mockInterventionUpdate(id, patch),
    collection: (sub: string) =>
      sub === "timeline_events"
        ? interventionTimelineCollection()
        : chainQuery(jest.fn(async () => emptySnap())),
  };
}

jest.mock("@/features/chatbot/chatbot-intervention-source", () => ({
  ...jest.requireActual("@/features/chatbot/chatbot-intervention-source"),
  fetchInterventionsForCompany: (...args: unknown[]) => mockFetchInterventions(...args),
}));

jest.mock("@/core/services/email/sendInterventionEmail", () => ({
  sendInterventionEmail: (...args: unknown[]) => mockSendInterventionEmail(...args),
}));

jest.mock("firebase-admin", () => ({
  apps: [{ name: "test-app" }],
  firestore: jest.fn(() => ({
    collection: (name: string) => {
      if (name === "clients") {
        return {
          ...chainQuery(mockClientsGet),
          doc: () => ({
            get: () => mockClientDocGet(),
            update: (...args: unknown[]) => mockClientDocUpdate(...args),
          }),
        };
      }
      if (name === "interventions") {
        return { doc: interventionDocRef };
      }
      if (name === "technicians") return chainQuery(mockTechniciansGet);
      if (name === "stockItems" || name === "stock_items") return chainQuery(mockStockGet);
      if (name === "material_orders") return chainQuery(mockMaterialOrdersGet);
      if (name === "sites") return chainQuery(mockSitesGet);
      if (name === "companies") {
        return {
          doc: () => ({
            collection: (sub: string) => {
              if (sub === "quotes") return chainQuery(mockQuotesGet);
              return chainQuery(jest.fn(async () => emptySnap()));
            },
          }),
        };
      }
      return chainQuery(jest.fn(async () => emptySnap()));
    },
  })),
}));

const ctx = {
  companyId: "co-test",
  actorUid: "uid-test",
  role: "admin" as const,
};

const confirmed = { userConfirmed: true as const };

const interventionFirestoreRow = {
  companyId: "co-test",
  status: "done",
  clientName: "Monsieur Vatsaev",
  clientId: CHATBOT_TEST_CRM_CLIENT.id,
  address: "Rue de la Fourche 9, 1000 Bruxelles",
  problem: "Porte",
  billingLines: [{ description: "Main d'oeuvre", unitPriceCents: 35000, quantity: 1 }],
  paymentStatus: "unpaid",
};

describe("executeChatbotTool", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInterventionUpdate.mockResolvedValue(undefined);
    mockClientDocUpdate.mockResolvedValue(undefined);
    mockTimelineAdd.mockResolvedValue({ id: "event-new" });
    mockSendInterventionEmail.mockResolvedValue({
      ok: true,
      messageId: "msg-1",
      attachmentFilename: "facture.pdf",
    });
    mockFetchInterventions.mockResolvedValue(chatbotTestInterventionRows());
    mockClientsGet.mockResolvedValue(
      snapFrom([{ id: CHATBOT_TEST_CRM_CLIENT.id, data: CHATBOT_TEST_CRM_CLIENT }]),
    );
    mockQuotesGet.mockResolvedValue(emptySnap());
    mockTechniciansGet.mockResolvedValue(
      snapFrom([{ id: "tech-1", data: { companyId: "co-test", name: "Jean Tech", uid: "uid-tech" } }]),
    );
    mockStockGet.mockResolvedValue(emptySnap());
    mockClientDocGet.mockResolvedValue({
      exists: true,
      data: () => CHATBOT_TEST_CRM_CLIENT,
    });
    mockInterventionDocGet.mockImplementation(async (id: string) => ({
      exists: true,
      id,
      data: () => ({ ...interventionFirestoreRow, id }),
    }));
    mockMaterialOrdersGet.mockResolvedValue(emptySnap());
    mockTimelineGet.mockResolvedValue(emptySnap());
    mockSitesGet.mockResolvedValue(
      snapFrom([{ id: "site-1", data: { label: "Siège", address: "Rue de la Fourche 9" } }]),
    );
  });

  it("throws for unknown tool", async () => {
    await expect(executeChatbotTool("not_a_tool", {}, ctx)).rejects.toThrow(/inconnu/i);
  });

  it("search_workspace returns CRM note when only interventions match", async () => {
    mockClientsGet.mockResolvedValue(emptySnap());
    const result = (await executeChatbotTool(
      "search_workspace",
      { query: "Vatsaev" },
      ctx,
    )) as {
      note: string | null;
      clients: unknown[];
      interventions: Array<{ id: string }>;
    };

    expect(result.clients).toHaveLength(0);
    expect(result.interventions.length).toBeGreaterThan(0);
    expect(result.note).toMatch(/fiche CRM/i);
  });

  it("search_workspace returns CRM client when present", async () => {
    const result = (await executeChatbotTool(
      "search_workspace",
      { query: "Vatsaev" },
      ctx,
    )) as {
      clients: Array<{ id: string; displayName: string }>;
      note: string | null;
    };

    expect(result.clients.some((c) => c.id === CHATBOT_TEST_CRM_CLIENT.id)).toBe(true);
    expect(result.note).toBeNull();
  });

  it("list_clients filters by search", async () => {
    mockClientsGet.mockResolvedValue(
      snapFrom([
        {
          id: "cl-a",
          data: {
            companyId: "co-test",
            displayName: "Alice Martin",
            firstName: "Alice",
            lastName: "Martin",
          },
        },
        {
          id: "cl-b",
          data: {
            companyId: "co-test",
            displayName: "Vatsaev SA",
            companyName: "Vatsaev SA",
          },
        },
      ]),
    );

    const rows = (await executeChatbotTool("list_clients", { search: "vatsaev" }, ctx)) as Array<{
      id: string;
    }>;

    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe("cl-b");
  });

  it("get_client_detail returns client, sites and linked interventions", async () => {
    mockFetchInterventions.mockResolvedValue(
      chatbotTestInterventionRows().map((row) =>
        row.id === "iv-fourche" ? { ...row, clientId: CHATBOT_TEST_CRM_CLIENT.id } : row,
      ),
    );

    const detail = (await executeChatbotTool(
      "get_client_detail",
      { clientId: CHATBOT_TEST_CRM_CLIENT.id },
      ctx,
    )) as {
      client: { id: string };
      sites: Array<{ id: string }>;
      interventions: Array<{ id: string }>;
    };

    expect(detail.client.id).toBe(CHATBOT_TEST_CRM_CLIENT.id);
    expect(detail.sites).toHaveLength(1);
    expect(detail.interventions.some((iv) => iv.id === "iv-fourche")).toBe(true);
  });

  it("get_client_detail rejects another company", async () => {
    mockClientDocGet.mockResolvedValue({
      exists: true,
      data: () => ({ ...CHATBOT_TEST_CRM_CLIENT, companyId: "co-other" }),
    });

    await expect(
      executeChatbotTool("get_client_detail", { clientId: CHATBOT_TEST_CRM_CLIENT.id }, ctx),
    ).rejects.toThrow(/autre société/i);
  });

  it("get_intervention_detail returns billing and timeline", async () => {
    mockTimelineGet.mockResolvedValue(
      snapFrom([{ id: "tl-1", data: { type: "note", content: "Appel client", createdAt: "2026-01-01" } }]),
    );

    const detail = (await executeChatbotTool(
      "get_intervention_detail",
      { interventionId: "iv-fourche" },
      ctx,
    )) as {
      id: string;
      clientName: string;
      billingLines: unknown[];
      recentTimeline: Array<{ id: string }>;
    };

    expect(detail.id).toBe("iv-fourche");
    expect(detail.clientName).toMatch(/Vatsaev/i);
    expect(detail.billingLines.length).toBeGreaterThan(0);
    expect(detail.recentTimeline[0]?.id).toBe("tl-1");
  });

  it("get_intervention_detail rejects wrong company", async () => {
    mockInterventionDocGet.mockResolvedValue({
      exists: true,
      id: "iv-x",
      data: () => ({ ...interventionFirestoreRow, companyId: "co-other" }),
    });

    await expect(
      executeChatbotTool("get_intervention_detail", { interventionId: "iv-x" }, ctx),
    ).rejects.toThrow(/autre société/i);
  });

  it("get_intervention_billing returns normalized lines", async () => {
    const billing = (await executeChatbotTool(
      "get_intervention_billing",
      { interventionId: "iv-fourche" },
      ctx,
    )) as { interventionId: string; billingLines: Array<{ description?: string; label?: string }> };

    expect(billing.interventionId).toBe("iv-fourche");
    const firstLine = billing.billingLines[0] as { description?: string; label?: string };
    expect(firstLine?.description ?? firstLine?.label).toBe("Main d'oeuvre");
  });

  it("get_workspace_summary aggregates interventions", async () => {
    const summary = (await executeChatbotTool("get_workspace_summary", {}, ctx)) as {
      interventionCount: number;
      byStatus: Record<string, number>;
      estimatedRevenueEur: number;
    };

    expect(summary.interventionCount).toBe(3);
    expect(summary.byStatus.done).toBe(2);
    expect(summary.byStatus.pending).toBe(1);
    expect(summary.estimatedRevenueEur).toBe(350);
  });

  it("list_technicians returns company technicians", async () => {
    const rows = (await executeChatbotTool("list_technicians", {}, ctx)) as Array<{ name: string }>;
    expect(rows[0]?.name).toBe("Jean Tech");
  });

  it("list_stock_alerts returns low-stock items", async () => {
    mockStockGet.mockResolvedValue(
      snapFrom([
        {
          id: "stock-1",
          data: { companyId: "co-test", name: "Cylindre", quantity: 1, alertThreshold: 5 },
        },
      ]),
    );

    const rows = (await executeChatbotTool("list_stock_alerts", {}, ctx)) as Array<{ name: string }>;
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("Cylindre");
  });

  it("list_interventions filters by status and search", async () => {
    const rows = (await executeChatbotTool("list_interventions", { status: "done", search: "fourche" }, ctx)) as Array<{
      id: string;
      status: string;
    }>;

    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe("iv-fourche");
    expect(rows[0]?.status).toBe("done");
  });

  it("list_material_orders requires interventionId", async () => {
    await expect(executeChatbotTool("list_material_orders", {}, ctx)).rejects.toThrow(/interventionId/i);
  });

  it("blocks write tools without userConfirmed", async () => {
    await expect(
      executeChatbotTool(
        "update_intervention_status",
        { interventionId: "iv-fourche", status: "done" },
        ctx,
      ),
    ).rejects.toThrow(/confirmation/i);
  });

  describe("write tools (userConfirmed)", () => {
    it("update_intervention_status updates Firestore and optional timeline note", async () => {
      const result = await executeChatbotTool(
        "update_intervention_status",
        {
          ...confirmed,
          interventionId: "iv-fourche",
          status: "in_progress",
          note: "Client rappelé",
        },
        ctx,
      );

      expect(result).toEqual({ ok: true, interventionId: "iv-fourche", status: "in_progress" });
      expect(mockInterventionUpdate).toHaveBeenCalledWith(
        "iv-fourche",
        expect.objectContaining({ status: "in_progress" }),
      );
      expect(mockTimelineAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("Client rappelé"),
          type: "comment",
        }),
      );
    });

    it("update_intervention_schedule sets date and time", async () => {
      const result = await executeChatbotTool(
        "update_intervention_schedule",
        {
          ...confirmed,
          interventionId: "iv-fourche",
          scheduledDate: "2026-06-01",
          scheduledTime: "14:00",
        },
        ctx,
      );

      expect(result).toMatchObject({
        ok: true,
        interventionId: "iv-fourche",
        scheduledDate: "2026-06-01",
        scheduledTime: "14:00",
      });
      expect(mockInterventionUpdate).toHaveBeenCalledWith(
        "iv-fourche",
        expect.objectContaining({
          scheduledDate: "2026-06-01",
          scheduledTime: "14:00",
        }),
      );
    });

    it("assign_technician patches assignment fields", async () => {
      const result = (await executeChatbotTool(
        "assign_technician",
        {
          ...confirmed,
          interventionId: "iv-fourche",
          technicianUid: "uid-tech",
          scheduledDate: "2026-06-02",
          scheduledTime: "09:30",
        },
        ctx,
      )) as { ok: boolean; assignedTechnicianUid?: string };

      expect(result.ok).toBe(true);
      expect(result.assignedTechnicianUid).toBe("uid-tech");
      expect(mockInterventionUpdate).toHaveBeenCalledWith(
        "iv-fourche",
        expect.objectContaining({ assignedTechnicianUid: "uid-tech" }),
      );
    });

    it("add_timeline_comment appends internal note", async () => {
      const result = await executeChatbotTool(
        "add_timeline_comment",
        { ...confirmed, interventionId: "iv-fourche", content: "Pièces commandées" },
        ctx,
      );

      expect(result).toEqual({ ok: true, eventId: "event-new" });
      expect(mockTimelineAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("Pièces commandées"),
          visibility: "internal",
        }),
      );
    });

    it("focus_intervention_document validates access without Firestore write", async () => {
      const result = await executeChatbotTool(
        "focus_intervention_document",
        { ...confirmed, interventionId: "iv-fourche", documentType: "invoice" },
        ctx,
      );

      expect(result).toEqual({
        ok: true,
        interventionId: "iv-fourche",
        documentType: "invoice",
      });
      expect(mockInterventionUpdate).not.toHaveBeenCalled();
    });

    it("patch_intervention_billing updates line price", async () => {
      const result = (await executeChatbotTool(
        "patch_intervention_billing",
        {
          ...confirmed,
          interventionId: "iv-fourche",
          unitPriceEur: 400,
          lineIndex: 0,
        },
        ctx,
      )) as { ok: boolean; totalEur: number; linePatched: number };

      expect(result.ok).toBe(true);
      expect(result.linePatched).toBe(0);
      expect(result.totalEur).toBe(400);
      expect(mockInterventionUpdate).toHaveBeenCalledWith(
        "iv-fourche",
        expect.objectContaining({
          billingLines: expect.arrayContaining([
            expect.objectContaining({ unitPriceCents: 40000 }),
          ]),
        }),
      );
    });

    it("append_intervention_billing_lines adds lines to existing billing", async () => {
      const result = (await executeChatbotTool(
        "append_intervention_billing_lines",
        {
          ...confirmed,
          interventionId: "iv-fourche",
          lines: [{ description: "Cylindre", unitPriceEur: 85, quantity: 1 }],
        },
        ctx,
      )) as { linesAdded: number; addedDescriptions: string[] };

      expect(result.linesAdded).toBe(1);
      expect(result.addedDescriptions).toContain("Cylindre");
      expect(mockInterventionUpdate).toHaveBeenCalledWith(
        "iv-fourche",
        expect.objectContaining({
          billingLines: expect.arrayContaining([
            expect.objectContaining({ description: "Main d'oeuvre" }),
            expect.objectContaining({ description: "Cylindre", unitPriceCents: 8500 }),
          ]),
        }),
      );
    });

    it("save_client_email persists on intervention and CRM", async () => {
      mockInterventionDocGet.mockImplementation(async (id: string) => ({
        exists: true,
        id,
        data: () => ({
          ...interventionFirestoreRow,
          id,
          clientId: CHATBOT_TEST_CRM_CLIENT.id,
          clientEmail: null,
        }),
      }));
      mockClientDocGet.mockResolvedValue({
        exists: true,
        data: () => ({ ...CHATBOT_TEST_CRM_CLIENT, email: null }),
      });

      const result = (await executeChatbotTool(
        "save_client_email",
        { interventionId: "iv-fourche", email: "nouveau@example.com" },
        ctx,
      )) as { ok: boolean; email: string; savedOnClient: boolean };

      expect(result.ok).toBe(true);
      expect(result.email).toBe("nouveau@example.com");
      expect(result.savedOnClient).toBe(true);
      expect(mockInterventionUpdate).toHaveBeenCalledWith("iv-fourche", {
        clientEmail: "nouveau@example.com",
      });
      expect(mockClientDocUpdate).toHaveBeenCalledWith({ email: "nouveau@example.com" });
    });

    it("send_intervention_email delegates to email service and syncs CRM email", async () => {
      mockInterventionDocGet.mockImplementation(async (id: string) => ({
        exists: true,
        id,
        data: () => ({
          ...interventionFirestoreRow,
          id,
          clientId: CHATBOT_TEST_CRM_CLIENT.id,
          clientEmail: null,
        }),
      }));
      mockClientDocGet.mockResolvedValue({
        exists: true,
        data: () => ({ ...CHATBOT_TEST_CRM_CLIENT, email: null }),
      });

      const result = await executeChatbotTool(
        "send_intervention_email",
        {
          ...confirmed,
          interventionId: "iv-fourche",
          to: "client@example.com",
          subject: "Facture",
          bodyText: "Bonjour, ci-joint la facture.",
          attachDocumentType: "invoice",
        },
        ctx,
      );

      expect(result).toMatchObject({
        ok: true,
        interventionId: "iv-fourche",
        to: "client@example.com",
        messageId: "msg-1",
      });
      expect(mockSendInterventionEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          interventionId: "iv-fourche",
          companyId: "co-test",
          sentVia: "chatbot",
          attachDocumentType: "invoice",
        }),
      );
      expect(mockInterventionUpdate).toHaveBeenCalledWith("iv-fourche", { clientEmail: "client@example.com" });
      expect(mockClientDocUpdate).toHaveBeenCalledWith({ email: "client@example.com" });
    });

    it("send_intervention_email forces invoice when model passes none", async () => {
      mockInterventionDocGet.mockImplementation(async (id: string) => ({
        exists: true,
        id,
        data: () => ({
          ...interventionFirestoreRow,
          id,
          clientId: CHATBOT_TEST_CRM_CLIENT.id,
          clientEmail: null,
        }),
      }));
      mockClientDocGet.mockResolvedValue({
        exists: true,
        data: () => ({ ...CHATBOT_TEST_CRM_CLIENT, email: null }),
      });

      await executeChatbotTool(
        "send_intervention_email",
        {
          ...confirmed,
          interventionId: "iv-fourche",
          to: "client@example.com",
          subject: "Facture",
          bodyText: "Ci-joint la facture.",
          attachDocumentType: "none",
        },
        { ...ctx, lastUserText: "envoie la facture par mail" },
      );

      expect(mockSendInterventionEmail).toHaveBeenLastCalledWith(
        expect.objectContaining({ attachDocumentType: "invoice" }),
      );
    });

    it("send_intervention_email defaults attachDocumentType to invoice when omitted", async () => {
      mockInterventionDocGet.mockImplementation(async (id: string) => ({
        exists: true,
        id,
        data: () => ({
          ...interventionFirestoreRow,
          id,
          clientId: CHATBOT_TEST_CRM_CLIENT.id,
          clientEmail: null,
        }),
      }));
      mockClientDocGet.mockResolvedValue({
        exists: true,
        data: () => ({ ...CHATBOT_TEST_CRM_CLIENT, email: null }),
      });

      await executeChatbotTool(
        "send_intervention_email",
        {
          ...confirmed,
          interventionId: "iv-fourche",
          to: "client@example.com",
          subject: "Facture",
          bodyText: "Bonjour, votre facture.",
        },
        ctx,
      );

      expect(mockSendInterventionEmail).toHaveBeenLastCalledWith(
        expect.objectContaining({ attachDocumentType: "invoice" }),
      );
    });
  });
});
