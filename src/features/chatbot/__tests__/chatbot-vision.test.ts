/** @jest-environment node */
import { diagnoseEquipmentPhoto } from "@/features/chatbot/chatbot-vision";

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

describe("diagnoseEquipmentPhoto", () => {
  const BASE_PARAMS = {
    photoUrl: "https://example.com/photo.jpg",
    apiKey: "test-key",
  };

  beforeEach(() => jest.clearAllMocks());

  it("parses a well-formed JSON response", async () => {
    const diagnosis = {
      equipmentType: "serrure",
      equipmentMake: "Vachette",
      equipmentModel: "A2P*",
      serialNumber: "SN-123",
      yearEstimate: "2018",
      failureModes: ["cylindre usé", "ressort cassé"],
      repairSteps: ["démonter", "remplacer cylindre"],
      partsToOrder: ["cylindre Vachette A2P 35/45"],
      safetyWarnings: ["couper alimentation"],
      confidence: "high" as const,
      rawSummary: "Serrure Vachette avec cylindre endommagé.",
    };
    mockCreate.mockResolvedValue(openaiResponse(JSON.stringify(diagnosis)));

    const result = await diagnoseEquipmentPhoto(BASE_PARAMS);

    expect(result.equipmentType).toBe("serrure");
    expect(result.equipmentMake).toBe("Vachette");
    expect(result.failureModes).toEqual(["cylindre usé", "ressort cassé"]);
    expect(result.confidence).toBe("high");
  });

  it("handles JSON embedded in extra text", async () => {
    const json = JSON.stringify({
      equipmentType: "chaudière",
      confidence: "medium",
      rawSummary: "Chaudière gaz.",
      failureModes: [],
      repairSteps: [],
      partsToOrder: [],
      safetyWarnings: [],
    });
    mockCreate.mockResolvedValue(openaiResponse(`Voici le résultat : ${json} fin`));

    const result = await diagnoseEquipmentPhoto(BASE_PARAMS);
    expect(result.equipmentType).toBe("chaudière");
    expect(result.confidence).toBe("medium");
  });

  it("returns safe defaults for missing fields", async () => {
    mockCreate.mockResolvedValue(openaiResponse("{}"));

    const result = await diagnoseEquipmentPhoto(BASE_PARAMS);
    expect(result.equipmentType).toBeNull();
    expect(result.equipmentMake).toBeNull();
    expect(result.failureModes).toEqual([]);
    expect(result.repairSteps).toEqual([]);
    expect(result.partsToOrder).toEqual([]);
    expect(result.safetyWarnings).toEqual([]);
    expect(result.confidence).toBe("low");
  });

  it("returns safe defaults when response is empty", async () => {
    mockCreate.mockResolvedValue(openaiResponse(""));

    const result = await diagnoseEquipmentPhoto(BASE_PARAMS);
    expect(result.failureModes).toEqual([]);
    expect(result.confidence).toBe("low");
  });

  it("uses gpt-4o-mini model by default", async () => {
    mockCreate.mockResolvedValue(openaiResponse("{}"));
    await diagnoseEquipmentPhoto(BASE_PARAMS);
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ model: "gpt-4o-mini" }));
  });

  it("uses custom modelName when provided", async () => {
    mockCreate.mockResolvedValue(openaiResponse("{}"));
    await diagnoseEquipmentPhoto({ ...BASE_PARAMS, modelName: "gpt-4o" });
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ model: "gpt-4o" }));
  });

  it("includes description text in message when provided", async () => {
    mockCreate.mockResolvedValue(openaiResponse("{}"));
    await diagnoseEquipmentPhoto({ ...BASE_PARAMS, description: "serrure bloquée" });

    const call = mockCreate.mock.calls[0]![0] as { messages: { role: string; content: unknown }[] };
    const userMsg = call.messages.find((m) => m.role === "user");
    const content = userMsg?.content as { type: string; text?: string }[];
    const textPart = content?.find((c) => c.type === "text");
    expect(textPart?.text).toContain("serrure bloquée");
  });

  it("does not include description part when description is blank", async () => {
    mockCreate.mockResolvedValue(openaiResponse("{}"));
    await diagnoseEquipmentPhoto({ ...BASE_PARAMS, description: "   " });

    const call = mockCreate.mock.calls[0]![0] as { messages: { role: string; content: unknown }[] };
    const userMsg = call.messages.find((m) => m.role === "user");
    const content = userMsg?.content as { type: string }[];
    const textParts = content?.filter((c) => c.type === "text");
    expect(textParts).toHaveLength(0);
  });
});
