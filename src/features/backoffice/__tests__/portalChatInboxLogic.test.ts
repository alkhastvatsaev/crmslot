import type { PortalChatDoc } from "@/features/backoffice/portalChatFirestore";
import {
  consolidateChatInboxPickerRows,
  countClientPortalThreadsNeedingReply,
  filterNewClientPortalMessages,
  filterPortalChatMessagesForSenderUid,
  interventionIdsWithClientPortalChat,
  normalizePortalChatInterventionId,
  PORTAL_CHAT_SENDER_THREAD_PREFIX,
  portalChatThreadKey,
  resolvePortalChatWriteInterventionId,
} from "@/features/backoffice/portalChatInboxLogic";

function msg(partial: Partial<PortalChatDoc> & Pick<PortalChatDoc, "id" | "role">): PortalChatDoc {
  return {
    companyId: "co-1",
    body: "hello",
    senderUid: "u-client",
    createdAt: new Date("2026-06-17T10:00:00.000Z"),
    ...partial,
  };
}

describe("portalChatInboxLogic", () => {
  it("portalChatThreadKey uses global bucket when intervention missing", () => {
    expect(portalChatThreadKey(null)).toBe("__global__");
    expect(portalChatThreadKey("iv-1")).toBe("iv-1");
  });

  it("interventionIdsWithClientPortalChat lists dossiers with client messages only", () => {
    const ids = interventionIdsWithClientPortalChat([
      msg({ id: "m1", role: "client", interventionId: "iv-a" }),
      msg({ id: "m2", role: "staff", interventionId: "iv-b" }),
      msg({ id: "m3", role: "client", interventionId: "iv-a" }),
      msg({ id: "m4", role: "client" }),
    ]);
    expect(ids.sort()).toEqual(["iv-a"]);
  });

  it("countClientPortalThreadsNeedingReply counts threads whose last message is client", () => {
    const count = countClientPortalThreadsNeedingReply([
      msg({
        id: "g1",
        role: "client",
        senderUid: "client-global",
        createdAt: new Date("2026-06-17T09:00:00.000Z"),
      }),
      msg({
        id: "iv1-c",
        role: "client",
        senderUid: "client-1",
        interventionId: "iv-1",
        createdAt: new Date("2026-06-17T08:00:00.000Z"),
      }),
      msg({
        id: "iv2-c",
        role: "client",
        senderUid: "client-2",
        interventionId: "iv-2",
        createdAt: new Date("2026-06-16T08:00:00.000Z"),
      }),
      msg({
        id: "iv2-c2",
        role: "client",
        senderUid: "client-2",
        interventionId: "iv-2",
        createdAt: new Date("2026-06-16T09:00:00.000Z"),
      }),
    ]);
    expect(count).toBe(3);
  });

  it("filterNewClientPortalMessages ignores staff uid and already seen ids", () => {
    const rows = [
      msg({ id: "a", role: "client", senderUid: "client-1" }),
      msg({ id: "b", role: "client", senderUid: "staff-1" }),
      msg({ id: "c", role: "staff", senderUid: "staff-1" }),
    ];
    const seen = new Set(["a"]);
    const fresh = filterNewClientPortalMessages(rows, seen, "staff-1");
    expect(fresh.map((r) => r.id)).toEqual([]);
  });

  it("filterNewClientPortalMessages returns unseen client messages", () => {
    const rows = [msg({ id: "n1", role: "client", senderUid: "client-1" })];
    const fresh = filterNewClientPortalMessages(rows, new Set(), "staff-1");
    expect(fresh).toHaveLength(1);
  });
});

describe("normalizePortalChatInterventionId", () => {
  it("rejette global et pseudo-fils __sender__", () => {
    expect(normalizePortalChatInterventionId("global")).toBeNull();
    expect(normalizePortalChatInterventionId(`${PORTAL_CHAT_SENDER_THREAD_PREFIX}uid1`)).toBeNull();
    expect(normalizePortalChatInterventionId("iv-abc")).toBe("iv-abc");
  });
});

describe("filterPortalChatMessagesForSenderUid isolation", () => {
  it("n'expose pas les staff globaux aux clients avec dossier", () => {
    const rows = [
      msg({ id: "1", role: "client", senderUid: "u1", interventionId: "iv1" }),
      msg({ id: "2", role: "staff", senderUid: "staff", interventionId: "iv1" }),
      msg({ id: "4", role: "staff", senderUid: "staff", body: "other" }),
      msg({ id: "5", role: "client", senderUid: "u2", interventionId: "iv2" }),
    ];
    const filtered = filterPortalChatMessagesForSenderUid(rows, "u1");
    expect(filtered.map((r) => r.id).sort()).toEqual(["1", "2"]);
  });
});

describe("consolidateChatInboxPickerRows", () => {
  it("fusionne dossier et fil sender pour le même client", () => {
    const messages = [msg({ id: "1", role: "client", senderUid: "u1", interventionId: "iv1" })];
    const rows = [
      { threadId: "iv1", clientName: "Dossier", time: "09:00", isToday: true },
      {
        threadId: `${PORTAL_CHAT_SENDER_THREAD_PREFIX}u1`,
        clientName: "Jean",
        time: "",
        isToday: false,
      },
    ];
    const out = consolidateChatInboxPickerRows(rows, messages);
    expect(out).toHaveLength(1);
    expect(out[0]?.threadId).toBe(`${PORTAL_CHAT_SENDER_THREAD_PREFIX}u1`);
    expect(out[0]?.clientName).toBe("Jean");
  });
});

describe("resolvePortalChatWriteInterventionId", () => {
  it("tag staff sur le dernier dossier client", () => {
    const rows = [msg({ id: "1", role: "client", senderUid: "u1", interventionId: "iv1" })];
    const iv = resolvePortalChatWriteInterventionId(
      `${PORTAL_CHAT_SENDER_THREAD_PREFIX}u1`,
      rows,
      "staff"
    );
    expect(iv).toBe("iv1");
  });
});
