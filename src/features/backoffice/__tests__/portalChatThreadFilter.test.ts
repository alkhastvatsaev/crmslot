import { filterPortalChatMessagesForThread } from "@/features/backoffice/portalChatThreadFilter";
import type { PortalChatDoc } from "@/features/backoffice/portalChatFirestore";

function msg(
  partial: Partial<PortalChatDoc> & Pick<PortalChatDoc, "id" | "role" | "body">
): PortalChatDoc {
  return {
    companyId: "co1",
    senderUid: "u1",
    createdAt: new Date(),
    ...partial,
  };
}

describe("filterPortalChatMessagesForThread", () => {
  const rows: PortalChatDoc[] = [
    msg({ id: "1", role: "client", body: "dossier", interventionId: "iv-1" }),
    msg({ id: "2", role: "staff", body: "réponse dossier", interventionId: "iv-1" }),
    msg({ id: "3", role: "staff", body: "réponse globale", interventionId: null }),
    msg({ id: "4", role: "client", body: "autre dossier", interventionId: "iv-2" }),
  ];

  it("sans fil dossier — tout le flux société", () => {
    expect(filterPortalChatMessagesForThread(rows, null)).toHaveLength(4);
    expect(filterPortalChatMessagesForThread(rows, "")).toHaveLength(4);
  });

  it("dossier client — messages du dossier + staff sans tag", () => {
    const filtered = filterPortalChatMessagesForThread(rows, "iv-1");
    expect(filtered.map((r) => r.id)).toEqual(["1", "2", "3"]);
  });

  it("n'inclut pas les messages client d'un autre dossier", () => {
    const filtered = filterPortalChatMessagesForThread(rows, "iv-1");
    expect(filtered.some((r) => r.id === "4")).toBe(false);
  });
});
