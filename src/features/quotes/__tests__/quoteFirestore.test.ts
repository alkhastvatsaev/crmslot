import { createQuote, updateQuote, updateQuoteStatus } from "../quoteFirestore";
import type { Quote } from "../types";

const mockAddDoc = jest.fn().mockResolvedValue({ id: "quote-123" });
const mockUpdateDoc = jest.fn().mockResolvedValue(undefined);
const mockServerTimestamp = jest.fn().mockReturnValue({ _sentinel: "serverTimestamp" });
const mockCollection = jest.fn().mockReturnValue("colRef");
const mockDoc = jest.fn().mockReturnValue("docRef");

jest.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  doc: (...args: unknown[]) => mockDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
}));

const db = {} as ReturnType<typeof import("firebase/firestore").getFirestore>;
const companyId = "company-1";

describe("quoteFirestore", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("createQuote", () => {
    it("creates a quote with draft status and computed total", async () => {
      const id = await createQuote(db, companyId, {
        lines: [
          { description: "Cylindre", quantity: 2, unitPriceCents: 5000 },
          { description: "Main-d'œuvre", quantity: 1, unitPriceCents: 8000 },
        ],
        validityDays: 30,
        notes: null,
        clientId: null,
        interventionId: "int-1",
        clientName: "Jean Dupont",
        clientEmail: "jean@test.be",
        createdByUid: "uid-1",
      });

      expect(id).toBe("quote-123");
      const call = mockAddDoc.mock.calls[0]![1] as Record<string, unknown>;
      expect(call.status).toBe("draft");
      expect(call.totalCents).toBe(18000); // 2×5000 + 1×8000
      expect(call.interventionId).toBe("int-1");
    });
  });

  describe("updateQuote", () => {
    it("recomputes totalCents when lines are updated", async () => {
      await updateQuote(db, companyId, "quote-123", {
        lines: [{ description: "Serrure", quantity: 1, unitPriceCents: 12000 }],
      });

      const call = mockUpdateDoc.mock.calls[0]![1] as Record<string, unknown>;
      expect(call.totalCents).toBe(12000);
    });

    it("does not set totalCents when lines are not in patch", async () => {
      await updateQuote(db, companyId, "quote-123", { notes: "Updated note" });

      const call = mockUpdateDoc.mock.calls[0]![1] as Record<string, unknown>;
      expect(call.totalCents).toBeUndefined();
      expect(call.notes).toBe("Updated note");
    });
  });

  describe("updateQuoteStatus", () => {
    it("sets sentAt when status is sent", async () => {
      await updateQuoteStatus(db, companyId, "quote-123", "sent");

      const call = mockUpdateDoc.mock.calls[0]![1] as Record<string, unknown>;
      expect(call.status).toBe("sent");
      expect(typeof call.sentAt).toBe("string");
    });

    it("sets respondedAt when status is accepted", async () => {
      await updateQuoteStatus(db, companyId, "quote-123", "accepted");

      const call = mockUpdateDoc.mock.calls[0]![1] as Record<string, unknown>;
      expect(call.status).toBe("accepted");
      expect(typeof call.respondedAt).toBe("string");
    });

    it("does not set sentAt or respondedAt for draft", async () => {
      await updateQuoteStatus(db, companyId, "quote-123", "draft");

      const call = mockUpdateDoc.mock.calls[0]![1] as Record<string, unknown>;
      expect(call.sentAt).toBeUndefined();
      expect(call.respondedAt).toBeUndefined();
    });
  });
});

// Needed for module resolution
function noop(..._args: unknown[]): void {}
import { getFirestore } from "firebase/firestore";
void noop(getFirestore);
