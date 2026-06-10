/** @jest-environment node */

import type * as admin from "firebase-admin";
import { allocateInvoiceNumberAdmin } from "../allocateInvoiceNumberAdmin";

type CounterData = { next?: number } | undefined;

function makeDb(initial: CounterData) {
  let stored = initial;
  const counterRef = { id: "counter" };
  const db = {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        collection: jest.fn(() => ({
          doc: jest.fn(() => counterRef),
        })),
      })),
    })),
    runTransaction: jest.fn(async (fn: (tx: unknown) => Promise<string>) => {
      const tx = {
        get: jest.fn(async () => ({
          exists: stored !== undefined,
          data: () => stored,
        })),
        set: jest.fn((_ref: unknown, data: { next: number }) => {
          stored = { ...(stored ?? {}), ...data };
        }),
      };
      return fn(tx);
    }),
  };
  return { db: db as unknown as admin.firestore.Firestore, getStored: () => stored };
}

const NOW = new Date("2026-06-10T12:00:00.000Z");

describe("allocateInvoiceNumberAdmin", () => {
  it("première facture de l'année → 00001 et compteur à 2", async () => {
    const { db, getStored } = makeDb(undefined);
    const num = await allocateInvoiceNumberAdmin(db, "c1", NOW);
    expect(num).toBe("FAC-2026-00001");
    expect(getStored()?.next).toBe(2);
  });

  it("incrémente la séquence existante", async () => {
    const { db, getStored } = makeDb({ next: 42 });
    const num = await allocateInvoiceNumberAdmin(db, "c1", NOW);
    expect(num).toBe("FAC-2026-00042");
    expect(getStored()?.next).toBe(43);
  });

  it("compteur corrompu → repart à 1", async () => {
    const { db } = makeDb({ next: Number.NaN });
    const num = await allocateInvoiceNumberAdmin(db, "c1", NOW);
    expect(num).toBe("FAC-2026-00001");
  });
});
