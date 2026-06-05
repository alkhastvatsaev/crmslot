import {
  buildTemplateDraftBilling,
  totalCentsFromBillingLines,
  buildDraftBillingPackage,
  refineDraftBillingWithOpenAI,
} from "@/features/interventions/draftInvoiceBilling";

const mockCreate = jest.fn();

jest.mock("@/core/services/audio/transcription", () => ({
  getClient: jest.fn(() => ({
    chat: {
      completions: {
        create: (...args: unknown[]) => mockCreate(...args),
      },
    },
  })),
}));

describe("draftInvoiceBilling", () => {
  const envKey = process.env.OPENAI_API_KEY;

  afterEach(() => {
    if (envKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = envKey;
    mockCreate.mockReset();
  });

  it("totalCentsFromBillingLines sums quantity × unit price", () => {
    const total = totalCentsFromBillingLines([
      { description: "Déplacement", quantity: 1, unitPriceCents: 4500 },
      { description: "Main d'œuvre", quantity: 2, unitPriceCents: 6500 },
    ]);
    expect(total).toBe(17_500);
  });

  it("buildTemplateDraftBilling proposes lines from problem text", () => {
    const lines = buildTemplateDraftBilling({
      problem: "porte bloquée ouverture",
      title: "",
      category: "serrurerie",
    });
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0]?.description).toBeTruthy();
  });

  it("buildDraftBillingPackage reuses existing billing lines", async () => {
    const existing = [
      { description: "Forfait", quantity: 1, unitPriceCents: 12_000, reference: "" },
    ];
    const pkg = await buildDraftBillingPackage({
      problem: "test",
      title: "",
      category: undefined,
      address: "",
      clientName: "",
      billingLines: existing,
    });
    expect(pkg.source).toBe("existing");
    expect(pkg.lines).toEqual(existing);
    expect(pkg.invoiceAmountCents).toBe(12_000);
  });

  it("refineDraftBillingWithOpenAI returns seed when API key is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const seed = [{ description: "Forfait", quantity: 1, unitPriceCents: 8000 }];
    const result = await refineDraftBillingWithOpenAI(
      { problem: "test", title: "", category: undefined, address: "", clientName: "" },
      seed,
    );
    expect(result.lines).toEqual(seed);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("buildDraftBillingPackage uses template when no existing lines", async () => {
    delete process.env.OPENAI_API_KEY;
    const pkg = await buildDraftBillingPackage({
      problem: "porte bloquée ouverture",
      title: "",
      category: "serrurerie",
      address: "Bruxelles",
      clientName: "Dupont",
      billingLines: [],
    });
    expect(pkg.lines.length).toBeGreaterThan(0);
    expect(pkg.invoiceAmountCents).toBeGreaterThan(0);
    expect(["template", "openai"]).toContain(pkg.source);
  });

  it("refineDraftBillingWithOpenAI falls back on invalid JSON", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "not-json" } }],
    });
    const seed = [{ description: "Seed", quantity: 1, unitPriceCents: 5000 }];
    const result = await refineDraftBillingWithOpenAI(
      { problem: "test", title: "", category: undefined, address: "", clientName: "" },
      seed,
    );
    expect(result.lines).toEqual(seed);
  });

  it("refineDraftBillingWithOpenAI parses model JSON", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              lines: [{ description: "Ouverture porte", quantity: 1, unitPriceCents: 15_000 }],
              note: "cohérent",
            }),
          },
        },
      ],
    });
    const seed = [{ description: "Brouillon", quantity: 1, unitPriceCents: 0 }];
    const result = await refineDraftBillingWithOpenAI(
      { problem: "porte bloquée", title: "Porte", category: "serrurerie", address: "Bruxelles", clientName: "Dupont" },
      seed,
    );
    expect(result.lines[0]?.unitPriceCents).toBe(15_000);
    expect(result.note).toBe("cohérent");
  });
});
