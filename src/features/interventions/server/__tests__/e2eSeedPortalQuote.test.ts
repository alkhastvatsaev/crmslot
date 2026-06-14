/** @jest-environment node */

import {
  E2E_PORTAL_QUOTE_DOC_ID,
  E2E_PORTAL_QUOTE_INTERVENTION_ID,
  E2E_PORTAL_QUOTE_TOKEN,
  e2eSeedPortalQuoteAdmin,
} from "@/features/interventions/server/e2eSeedPortalQuote";

jest.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: () => "__ts__",
    delete: () => "__delete__",
  },
}));

describe("e2eSeedPortalQuoteAdmin", () => {
  it("crée un dossier assigned et un devis sent", async () => {
    const ivSet = jest.fn(async () => {});
    const ivUpdate = jest.fn(async () => {});
    const quoteSet = jest.fn(async () => {});

    const db = {
      collection: (name: string) => {
        if (name === "interventions") {
          return {
            doc: () => ({
              get: async () => ({ exists: false }),
              set: ivSet,
              update: ivUpdate,
            }),
          };
        }
        if (name === "companies") {
          return {
            doc: () => ({
              collection: () => ({
                doc: () => ({ set: quoteSet }),
              }),
            }),
          };
        }
        throw new Error(name);
      },
    };

    const result = await e2eSeedPortalQuoteAdmin(db as never, { scenario: "assigned" });

    expect(result).toMatchObject({
      interventionId: E2E_PORTAL_QUOTE_INTERVENTION_ID,
      portalToken: E2E_PORTAL_QUOTE_TOKEN,
      quoteId: E2E_PORTAL_QUOTE_DOC_ID,
      scenario: "assigned",
      reset: false,
    });
    expect(ivSet).toHaveBeenCalled();
    expect(quoteSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: "sent", interventionId: E2E_PORTAL_QUOTE_INTERVENTION_ID })
    );
  });
});
