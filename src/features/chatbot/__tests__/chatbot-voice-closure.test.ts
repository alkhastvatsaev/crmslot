/** @jest-environment node */
import { parseVoiceJobClosure } from "@/features/chatbot/chatbot-voice-closure";

const mockCreate = jest.fn();

jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

function openaiResponse(content: string) {
  return {
    choices: [{ message: { content } }],
  };
}

describe("parseVoiceJobClosure", () => {
  const BASE = { transcription: "J'ai changé le cylindre, payé en cash 120€.", apiKey: "test-key" };

  beforeEach(() => jest.clearAllMocks());

  it("parses a complete voice closure", async () => {
    const payload = {
      reportText: "Remplacement du cylindre de serrure. Client satisfait.",
      billingLines: [{ description: "Cylindre Vachette", quantity: 1, unitPriceEur: 80 }],
      paymentStatus: "cash",
      paymentAmountEur: 120,
      followUpAction: null,
      followUpQuoteNeeded: false,
      partsUsed: ["Cylindre Vachette A2P"],
      laborHours: 1,
      clientSatisfied: true,
      confidence: "high",
    };
    mockCreate.mockResolvedValue(openaiResponse(JSON.stringify(payload)));

    const result = await parseVoiceJobClosure(BASE);

    expect(result.reportText).toBe("Remplacement du cylindre de serrure. Client satisfait.");
    expect(result.billingLines).toHaveLength(1);
    expect(result.billingLines[0]?.unitPriceEur).toBe(80);
    expect(result.paymentStatus).toBe("cash");
    expect(result.paymentAmountEur).toBe(120);
    expect(result.laborHours).toBe(1);
    expect(result.clientSatisfied).toBe(true);
    expect(result.confidence).toBe("high");
  });

  it("returns safe defaults for empty JSON", async () => {
    mockCreate.mockResolvedValue(openaiResponse("{}"));

    const result = await parseVoiceJobClosure(BASE);

    expect(result.reportText).toBe("");
    expect(result.billingLines).toEqual([]);
    expect(result.paymentStatus).toBeNull();
    expect(result.paymentAmountEur).toBeNull();
    expect(result.followUpAction).toBeNull();
    expect(result.followUpQuoteNeeded).toBe(false);
    expect(result.partsUsed).toEqual([]);
    expect(result.laborHours).toBeNull();
    expect(result.clientSatisfied).toBeNull();
    expect(result.confidence).toBe("low");
  });

  it("ignores non-number paymentAmountEur", async () => {
    mockCreate.mockResolvedValue(
      openaiResponse(JSON.stringify({ paymentAmountEur: "cent vingt" }))
    );
    const result = await parseVoiceJobClosure(BASE);
    expect(result.paymentAmountEur).toBeNull();
  });

  it("ignores non-number laborHours", async () => {
    mockCreate.mockResolvedValue(openaiResponse(JSON.stringify({ laborHours: "deux heures" })));
    const result = await parseVoiceJobClosure(BASE);
    expect(result.laborHours).toBeNull();
  });

  it("followUpQuoteNeeded is false unless explicitly true", async () => {
    mockCreate.mockResolvedValue(openaiResponse(JSON.stringify({ followUpQuoteNeeded: "yes" })));
    const result = await parseVoiceJobClosure(BASE);
    expect(result.followUpQuoteNeeded).toBe(false);
  });

  it("followUpQuoteNeeded is true when JSON has true", async () => {
    mockCreate.mockResolvedValue(openaiResponse(JSON.stringify({ followUpQuoteNeeded: true })));
    const result = await parseVoiceJobClosure(BASE);
    expect(result.followUpQuoteNeeded).toBe(true);
  });

  it("uses gpt-4o-mini model by default", async () => {
    mockCreate.mockResolvedValue(openaiResponse("{}"));
    await parseVoiceJobClosure(BASE);
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ model: "gpt-4o-mini" }));
  });

  it("uses custom modelName when provided", async () => {
    mockCreate.mockResolvedValue(openaiResponse("{}"));
    await parseVoiceJobClosure({ ...BASE, modelName: "gpt-4o" });
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ model: "gpt-4o" }));
  });

  it("uses json_object response_format", async () => {
    mockCreate.mockResolvedValue(openaiResponse("{}"));
    await parseVoiceJobClosure(BASE);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ response_format: { type: "json_object" } })
    );
  });
});
