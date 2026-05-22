import {
  MATERIAL_AGENT_CLIENT_NAME_MARKER,
  buildMaterialAgentClientNameRegisteredReply,
  isAwaitingMaterialAgentClientName,
  isMaterialAgentLecotCommandText,
  materialAgentAskClientNameAssistantContent,
  parseMaterialAgentClientNameFromUserText,
  resolveMaterialAgentOrderClientName,
  shouldResetMaterialOrderClientSession,
} from "@/features/featureHub/materialAgentOrderClient";

describe("materialAgentOrderClient", () => {
  it("detects awaiting client name from assistant marker", () => {
    const messages = [
      { role: "user", content: "Commander CYL-1 — Cylindre" },
      { role: "assistant", content: materialAgentAskClientNameAssistantContent() },
    ];
    expect(isAwaitingMaterialAgentClientName(messages)).toBe(true);
    expect(messages[1].content).toContain(MATERIAL_AGENT_CLIENT_NAME_MARKER);
  });

  it("does not treat Lecot order phrases as client names", () => {
    expect(parseMaterialAgentClientNameFromUserText("commande lecot")).toBeNull();
    expect(parseMaterialAgentClientNameFromUserText("nouvelle commande lecot")).toBeNull();
    expect(isMaterialAgentLecotCommandText("nouvelle commande lecot")).toBe(true);
    expect(shouldResetMaterialOrderClientSession("nouvelle commande lecot")).toBe(true);
  });

  it("parses client name only when awaiting or explicit prefix", () => {
    expect(parseMaterialAgentClientNameFromUserText("Dupont")).toBeNull();
    expect(parseMaterialAgentClientNameFromUserText("client Martin SPRL")).toBe("Martin SPRL");
    expect(parseMaterialAgentClientNameFromUserText("nom : Jean Dupont")).toBe("Jean Dupont");

    const messages = [
      { role: "user", content: "Commander 1" },
      { role: "assistant", content: materialAgentAskClientNameAssistantContent() },
    ];
    expect(parseMaterialAgentClientNameFromUserText("Jean Dupont", messages)).toBe("Jean Dupont");
  });

  it("resolveMaterialAgentOrderClientName uses session unless reset intent", () => {
    expect(
      resolveMaterialAgentOrderClientName({
        orderClientNameFromClient: "Martin SPRL",
        messages: [],
        lastUserText: "x",
      }),
    ).toBe("Martin SPRL");

    expect(
      resolveMaterialAgentOrderClientName({
        orderClientNameFromClient: "Martin SPRL",
        messages: [],
        lastUserText: "nouvelle commande lecot",
      }),
    ).toBeNull();

    const messages = [
      { role: "user", content: "Commander 1" },
      { role: "assistant", content: materialAgentAskClientNameAssistantContent() },
      { role: "user", content: "Jean Dupont" },
    ];
    expect(
      resolveMaterialAgentOrderClientName({
        orderClientNameFromClient: null,
        messages,
        lastUserText: "Jean Dupont",
      }),
    ).toBe("Jean Dupont");
  });

  it("buildMaterialAgentClientNameRegisteredReply mentions client", () => {
    expect(buildMaterialAgentClientNameRegisteredReply("Dupont")).toMatch(/Dupont/);
  });
});
