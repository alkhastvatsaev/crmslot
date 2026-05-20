import {
  extractEmailAddressFromText,
  findPendingEmailFromConversation,
  isBareEmailOnlyMessage,
  looksLikeClientEmailCaptureMessage,
} from "@/features/chatbot/chatbot-client-email";

describe("chatbot-client-email", () => {
  it("extracts email from natural language", () => {
    expect(extractEmailAddressFromText("Son mail est dupont@example.com")).toBe("dupont@example.com");
    expect(extractEmailAddressFromText("Envoie à client@test.be la facture")).toBe("client@test.be");
  });

  it("detects save-intent vs send-intent", () => {
    expect(looksLikeClientEmailCaptureMessage("Le mail de Vatsaev : v@t.com")).toBe(true);
    expect(looksLikeClientEmailCaptureMessage("Envoie la facture à v@t.com")).toBe(false);
    expect(isBareEmailOnlyMessage("alkhastvatsaev@gmail.com")).toBe(true);
    expect(looksLikeClientEmailCaptureMessage("alkhastvatsaev@gmail.com")).toBe(true);
  });

  it("findPendingEmailFromConversation after disambiguation prompt", () => {
    const email = findPendingEmailFromConversation([
      { role: "user", content: "alkhastvatsaev@gmail.com" },
      {
        role: "assistant",
        content: "Indiquez le nom du client ou ouvrez le dossier concerné, puis redonnez l'adresse email.",
      },
      { role: "user", content: "Vatsaev" },
    ]);
    expect(email).toBe("alkhastvatsaev@gmail.com");
  });
});
