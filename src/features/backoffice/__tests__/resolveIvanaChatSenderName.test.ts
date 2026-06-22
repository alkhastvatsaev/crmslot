import { resolveIvanaChatSenderName } from "@/features/backoffice/resolveIvanaChatSenderName";

const t = (key: string) => key;

describe("resolveIvanaChatSenderName", () => {
  it("client — prénom compte portail", () => {
    const name = resolveIvanaChatSenderName({
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
    const name = resolveIvanaChatSenderName({
      publishAsPortal: false,
      user: { displayName: null, email: "staff@co.com" } as never,
      staffFields: {
        firstName: "Jean",
        lastName: "Martin",
        email: "staff@co.com",
        companyName: "Co",
        roleLabel: "admin",
      },
      t,
    });
    expect(name).toBe("Jean Martin");
  });
});
