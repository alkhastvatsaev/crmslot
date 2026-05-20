import {
  buildInstantLecotOrderPayload,
  extractCatalogLinesFromAssistantText,
  parseLecotInstantOrderIntent,
} from "@/features/chatbot/chatbot-lecot-instant-order";

describe("chatbot-lecot-instant-order", () => {
  it("parseLecotInstantOrderIntent from quick-action payload", () => {
    expect(
      parseLecotInstantOrderIntent("Commander LEC-SER-1001 — Serrure multipoints Vachette"),
    ).toEqual({
      kind: "sku",
      sku: "LEC-SER-1001",
      label: "Serrure multipoints Vachette",
    });
  });

  it("parseLecotInstantOrderIntent from rank button", () => {
    expect(parseLecotInstantOrderIntent("Commander 2")).toEqual({ kind: "rank", rank: 2 });
  });

  it("extractCatalogLinesFromAssistantText", () => {
    const text = `**Catalogue Lecot** (recherche locale, 0 token) :
1. [Serrure A](lecot:https://lecot.be?q=1) — 145,00 € HT (SKU LEC-SER-1001)
2. [Serrure B](lecot:https://lecot.be?q=2) — 218,00 € HT (SKU LEC-SER-1002)`;
    expect(extractCatalogLinesFromAssistantText(text)).toEqual([
      { rank: 1, label: "Serrure A", sku: "LEC-SER-1001" },
      { rank: 2, label: "Serrure B", sku: "LEC-SER-1002" },
    ]);
  });

  it("buildInstantLecotOrderPayload uses catalog price and quantity 1", async () => {
    const assistant = `**Catalogue Lecot** :
1. [Serrure multipoints Vachette Radialis 3 points](lecot:https://lecot.be) — 145,00 € HT (SKU LEC-SER-1001)`;
    const payload = await buildInstantLecotOrderPayload(
      "co-test",
      "Commander LEC-SER-1001 — Serrure multipoints Vachette Radialis 3 points",
      [
        { role: "user", content: "serrure lecot" },
        { role: "assistant", content: assistant },
        {
          role: "user",
          content: "Commander LEC-SER-1001 — Serrure multipoints Vachette Radialis 3 points",
        },
      ],
    );
    expect(payload?.lines).toHaveLength(1);
    expect(payload?.lines[0]).toMatchObject({
      sku: "LEC-SER-1001",
      quantity: 1,
      unitPriceEur: 145,
    });
  });

  it("buildInstantLecotOrderPayload from Commander 2 after catalogue list", async () => {
    const assistant = `**Catalogue Lecot** :
1. [Serrure A](lecot:https://lecot.be) — 145,00 € HT (SKU LEC-SER-1001)
2. [Serrure B](lecot:https://lecot.be) — 218,00 € HT (SKU LEC-SER-1002)`;
    const payload = await buildInstantLecotOrderPayload("co-test", "Commander 2", [
      { role: "user", content: "propose 5 serrures lecot" },
      { role: "assistant", content: assistant },
      { role: "user", content: "Commander 2" },
    ]);
    expect(payload?.lines[0]?.sku).toBe("LEC-SER-1002");
    expect(payload?.lines[0]?.quantity).toBe(1);
  });
});
