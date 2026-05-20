import {
  inferEmailAttachDocumentType,
  normalizeSendInterventionEmailArguments,
  resolveSendInterventionEmailAttachType,
} from "@/features/chatbot/chatbot-email-attach";

describe("chatbot-email-attach", () => {
  it("defaults to invoice when attachDocumentType omitted", () => {
    expect(
      resolveSendInterventionEmailAttachType({
        subject: "Votre intervention",
        bodyText: "Bonjour",
      }),
    ).toBe("invoice");
  });

  it("infers quote from devis mention", () => {
    expect(inferEmailAttachDocumentType("envoie le devis par mail")).toBe("quote");
  });

  it("infers invoice from facture / pdf", () => {
    expect(inferEmailAttachDocumentType("envoie la facture en pdf")).toBe("invoice");
  });

  it("ignores model none when user asked for facture", () => {
    expect(
      resolveSendInterventionEmailAttachType(
        { attachDocumentType: "none", subject: "Facture", bodyText: "Ci-joint" },
        "envoie la facture par mail à dupont",
      ),
    ).toBe("invoice");
  });

  it("ignores model none without explicit user refusal", () => {
    expect(
      resolveSendInterventionEmailAttachType(
        { attachDocumentType: "none", subject: "Intervention", bodyText: "Bonjour" },
        null,
      ),
    ).toBe("invoice");
  });

  it("respects explicit sans pj in user message", () => {
    expect(
      resolveSendInterventionEmailAttachType(
        { attachDocumentType: "invoice" },
        "envoie un mail sans pièce jointe",
      ),
    ).toBe("none");
  });

  it("normalizeSendInterventionEmailArguments mutates args", () => {
    const args: Record<string, unknown> = { attachDocumentType: "none" };
    normalizeSendInterventionEmailArguments(args, "envoie la facture par email");
    expect(args.attachDocumentType).toBe("invoice");
  });
});
