import { resolvePortalChatSenderName } from "@/features/backoffice/resolvePortalChatSenderName";

const t = (key: string) => key;

describe("resolvePortalChatSenderName", () => {
  it("client — prénom compte portail", () => {
    const name = resolvePortalChatSenderName({
      publishAsPortal: true,
      user: { displayName: null, email: "x@y.com" } as never,
      clientAccountFields: {
        firstName: "Marie",
        lastName: "Dupont",
        email: "x@y.com",
        phone: "",
        address: "",
      },
      t,
    });
    expect(name).toBe("Marie Dupont");
  });

  it("staff — nom CRM", () => {
    const name = resolvePortalChatSenderName({
      publishAsPortal: false,
      user: { displayName: null, email: "staff@co.com" } as never,
      staffFields: {
        firstName: "Jean",
        lastName: "Martin",
        email: "staff@co.com",
        phone: "",
        companyId: "co-1",
        companyName: "Co",
        accountRole: "dispatcher",
      },
      t,
    });
    expect(name).toBe("Jean Martin");
  });
});
