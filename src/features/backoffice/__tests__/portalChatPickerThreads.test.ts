import {
  enrichChatDayRowsFromPortalMessages,
  portalChatPickerThreadId,
  filterPortalChatMessagesForSenderUid,
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
  it("regroupe par client même avec dossier intervention", () => {
    expect(
      portalChatPickerThreadId({
        role: "client",
        interventionId: "iv-42",
        senderUid: "uid-a",
      })
    ).toBe("__sender__:uid-a");
  });
});

describe("filterPortalChatMessagesForThread", () => {
  const rows: PortalChatDoc[] = [
    msg({ id: "1", role: "client", body: "hello", senderUid: "uid-a" }),
    msg({ id: "2", role: "client", body: "dossier", senderUid: "uid-a", interventionId: "iv-1" }),
    msg({ id: "3", role: "staff", body: "reply", senderUid: "staff-1", interventionId: "iv-1" }),
    msg({ id: "4", role: "client", body: "other", senderUid: "uid-b" }),
  ];

  it("affiche tout l’historique client + staff sur ses dossiers", () => {
    const filtered = filterPortalChatMessagesForThread(rows, "__sender__:uid-a");
    expect(filtered.map((r) => r.id)).toEqual(["1", "2", "3"]);
  });

  it("filtre un dossier intervention précis", () => {
    const filtered = filterPortalChatMessagesForThread(rows, "iv-1");
    expect(filtered.map((r) => r.id)).toEqual(["2", "3"]);
  });
});

describe("filterPortalChatMessagesForSenderUid", () => {
  it("inclut les réponses staff taggées sur les dossiers du client", () => {
    const rows = [
      msg({ id: "c1", role: "client", body: "hi", senderUid: "uid-x", interventionId: "iv-9" }),
      msg({ id: "s1", role: "staff", body: "ok", senderUid: "staff", interventionId: "iv-9" }),
    ];
    expect(filterPortalChatMessagesForSenderUid(rows, "uid-x").map((r) => r.id)).toEqual([
      "c1",
      "s1",
    ]);
  });
});

describe("enrichChatDayRowsFromPortalMessages", () => {
  it("ajoute une ligne par client avec son nom", () => {
    const rows = enrichChatDayRowsFromPortalMessages(
      [],
      [
        msg({
          id: "1",
          role: "client",
          body: "Bonjour",
          senderUid: "uid-x",
          senderName: "Marie Dupont",
          interventionId: "iv-1",
        }),
      ]
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.threadId).toBe("__sender__:uid-x");
    expect(rows[0]?.clientName).toBe("Marie Dupont");
  });
});
