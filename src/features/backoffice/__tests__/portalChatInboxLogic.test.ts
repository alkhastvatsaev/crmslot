import type { IvanaPortalChatDoc } from "@/features/backoffice/ivanaChatFirestore";
import {
  countClientPortalThreadsNeedingReply,
  filterNewClientPortalMessages,
  interventionIdsWithClientPortalChat,
  portalChatThreadKey,
} from "@/features/backoffice/portalChatInboxLogic";

function msg(
  partial: Partial<IvanaPortalChatDoc> & Pick<IvanaPortalChatDoc, "id" | "role">
): IvanaPortalChatDoc {
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
        createdAt: new Date("2026-06-17T09:00:00.000Z"),
      }),
      msg({
        id: "iv1-c",
        role: "client",
        interventionId: "iv-1",
        createdAt: new Date("2026-06-17T08:00:00.000Z"),
      }),
      msg({
        id: "iv2-c",
        role: "client",
        interventionId: "iv-2",
        createdAt: new Date("2026-06-16T08:00:00.000Z"),
      }),
      msg({
        id: "iv2-c2",
        role: "client",
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
