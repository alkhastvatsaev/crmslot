import {
  buildLecotProductQuickActions,
  deriveChatbotQuickActions,
  mergeQuickActions,
  type ChatbotQuickAction,
} from "@/features/chatbot/chatbot-quick-actions";

describe("chatbot-quick-actions", () => {
  it("buildLecotProductQuickActions creates order buttons with sku payload", () => {
    const actions = buildLecotProductQuickActions([
      { rank: 1, sku: "LEC-2001", label: "Serrure Vachette", unitPriceEur: 145 },
      { rank: 2, sku: "LEC-3001", label: "Cylindre", unitPriceEur: 35 },
    ]);
    expect(actions).toHaveLength(2);
    expect(actions[0].payload).toBe("Commander LEC-2001 — Serrure Vachette");
    expect(actions[0].variant).toBe("primary");
    expect(actions[0].label).toContain("145");
  });

  it("deriveChatbotQuickActions parses catalogue Lecot lines", () => {
    const text = `**Catalogue Lecot** (recherche locale, 0 token) :
1. [Serrure multipoints](lecot:https://lecot.be/q) — 145,00 € HT (SKU LEC-2001)
2. [Cylindre Yale](lecot:https://lecot.be/q2) — 35,00 € HT (SKU LEC-3002)`;
    const actions = deriveChatbotQuickActions(text);
    expect(actions.length).toBeGreaterThanOrEqual(2);
    expect(actions[0].payload).toContain("LEC-2001");
  });

  it("deriveChatbotQuickActions builds yes/no for questions", () => {
    const actions = deriveChatbotQuickActions("Quel montant souhaitez-vous sur la facture ?");
    expect(actions.some((a) => a.payload === "oui")).toBe(true);
    expect(actions.some((a) => a.payload === "non")).toBe(true);
  });

  it("mergeQuickActions deduplicates by id", () => {
    const a = [{ id: "x", label: "A", kind: "send_message" as const, payload: "a" }];
    const b = [{ id: "x", label: "B", kind: "send_message" as const, payload: "b" }];
    expect(mergeQuickActions(a, b)).toHaveLength(1);
  });

  it("buildLecotProductQuickActions limits to five suggestions", () => {
    const rows = Array.from({ length: 6 }, (_, i) => ({
      rank: i + 1,
      sku: `LEC-${i}`,
      label: `Pièce ${i}`,
      unitPriceEur: 10,
    }));
    expect(buildLecotProductQuickActions(rows)).toHaveLength(5);
  });

  it("deriveChatbotQuickActions uses suggestionLabels when provided", () => {
    const actions = deriveChatbotQuickActions("", {
      suggestionLabels: ["Briefing du jour", "Stock en alerte"],
    });
    expect(actions).toHaveLength(2);
    expect(actions[0].payload).toBe("Briefing du jour");
    expect(actions[0].variant).toBe("primary");
  });

  it("deriveChatbotQuickActions skips yes/no when catalogue Lecot is present", () => {
    const text =
      "**Catalogue Lecot** :\n1. [Serrure](lecot:https://lecot.be) — 10 € (SKU LEC-1)\nQuel produit souhaitez-vous ?";
    const actions = deriveChatbotQuickActions(text);
    expect(actions.some((a) => a.payload === "oui")).toBe(false);
    expect(actions.some((a) => a.id.startsWith("lecot-derived"))).toBe(true);
  });

  it("deriveChatbotQuickActions returns empty for blank text without labels", () => {
    expect(deriveChatbotQuickActions("   ")).toEqual([]);
  });

  it("mergeQuickActions caps output at 8 actions", () => {
    const make = (prefix: string, n: number) =>
      Array.from({ length: n }, (_, i) => ({
        id: `${prefix}-${i}`,
        kind: "send_message" as const,
        label: `Action ${prefix}-${i}`,
        payload: `p-${prefix}-${i}`,
      }));
    expect(mergeQuickActions(make("a", 5), make("b", 5))).toHaveLength(8);
  });

  it("mergeQuickActions keeps primary list first when merging", () => {
    const primary: ChatbotQuickAction[] = [
      { id: "a", label: "A", kind: "send_message", payload: "pa", variant: "primary" },
    ];
    const fallback: ChatbotQuickAction[] = [
      { id: "b", label: "B", kind: "send_message", payload: "pb", variant: "outline" },
    ];
    const merged = mergeQuickActions(primary, fallback);
    expect(merged[0].id).toBe("a");
    expect(merged[1].id).toBe("b");
  });

  it("buildLecotProductQuickActions omits price display when unitPriceEur is 0", () => {
    const actions = buildLecotProductQuickActions([
      { rank: 1, sku: "LEC-X", label: "Sans prix", unitPriceEur: 0 },
    ]);
    expect(actions[0].label).not.toContain("€");
    expect(actions[0].payload).toBe("Commander LEC-X — Sans prix");
  });

  it("buildLecotProductQuickActions assigns primary variant only to rank 1", () => {
    const actions = buildLecotProductQuickActions([
      { rank: 1, sku: "LEC-1", label: "Premier", unitPriceEur: 10 },
      { rank: 2, sku: "LEC-2", label: "Deuxième", unitPriceEur: 20 },
      { rank: 3, sku: "LEC-3", label: "Troisième", unitPriceEur: 30 },
    ]);
    expect(actions[0].variant).toBe("primary");
    expect(actions[1].variant).toBe("secondary");
    expect(actions[2].variant).toBe("secondary");
  });
});
