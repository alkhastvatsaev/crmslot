import {
  enrichChatDayRowsFromPortalMessages,
  portalChatPickerThreadId,
} from "@/features/backoffice/portalChatInboxLogic";
import { filterPortalChatMessagesForThread } from "@/features/backoffice/portalChatThreadFilter";
import type { PortalChatDoc } from "@/features/backoffice/portalChatFirestore";

function msg(
  partial: Partial<PortalChatDoc> & Pick<PortalChatDoc, "id" | "role" | "body">
): PortalChatDoc {
  return {
    companyId: "co-1",
    senderUid: "uid-1",
    createdAt: new Date("2026-06-24T10:00:00Z"),
    ...partial,
  };
}

describe("portalChatPickerThreadId", () => {
  it("utilise le dossier quand interventionId est présent", () => {
    expect(
      portalChatPickerThreadId({
        role: "client",
        interventionId: "iv-42",
        senderUid: "uid-a",
      })
    ).toBe("iv-42");
  });

  it("crée un fil par client anonyme sans dossier", () => {
    expect(
      portalChatPickerThreadId({
        role: "client",
        senderUid: "uid-anon",
      })
    ).toBe("__sender__:uid-anon");
  });
});

describe("filterPortalChatMessagesForThread", () => {
  const rows: PortalChatDoc[] = [
    msg({ id: "1", role: "client", body: "hello", senderUid: "uid-a" }),
    msg({ id: "2", role: "client", body: "other", senderUid: "uid-b" }),
    msg({ id: "3", role: "staff", body: "reply", senderUid: "staff-1" }),
    msg({ id: "4", role: "client", body: "dossier", interventionId: "iv-1", senderUid: "uid-c" }),
  ];

  it("filtre par client anonyme", () => {
    const filtered = filterPortalChatMessagesForThread(rows, "__sender__:uid-a");
    expect(filtered.map((r) => r.id)).toEqual(["1"]);
  });

  it("affiche tous les messages sans dossier pour le fil global", () => {
    const filtered = filterPortalChatMessagesForThread(rows, "global");
    expect(filtered.map((r) => r.id)).toEqual(["1", "2", "3"]);
  });
});

describe("enrichChatDayRowsFromPortalMessages", () => {
  it("ajoute une ligne client même sans intervention chargée", () => {
    const rows = enrichChatDayRowsFromPortalMessages(
      [],
      [
        msg({
          id: "1",
          role: "client",
          body: "Bonjour",
          senderUid: "uid-x",
          senderName: "Marie Dupont",
        }),
      ]
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.threadId).toBe("__sender__:uid-x");
    expect(rows[0]?.clientName).toBe("Marie Dupont");
  });
});
