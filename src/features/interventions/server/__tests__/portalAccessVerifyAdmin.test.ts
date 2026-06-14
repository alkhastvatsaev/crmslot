/** @jest-environment node */

import { verifyPortalAccessAdmin } from "@/features/interventions/server/portalAccessVerifyAdmin";

function buildDbMock(params: {
  codeDocs: Array<{ id: string; data: Record<string, unknown> }>;
  emailDocs: Array<{ id: string; data: Record<string, unknown> }>;
}) {
  let queryCount = 0;
  const chain = {
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn(async () => {
      queryCount += 1;
      const docs = queryCount === 1 ? params.codeDocs : params.emailDocs;
      return {
        docs: docs.map((row) => ({
          id: row.id,
          data: () => row.data,
        })),
      };
    }),
  };

  return {
    db: {
      collection: jest.fn(() => chain),
    },
  };
}

describe("verifyPortalAccessAdmin", () => {
  it("retourne les dossiers avec le numéro seul", async () => {
    const { db } = buildDbMock({
      codeDocs: [
        {
          id: "iv-1",
          data: {
            portalAccessCode: "ABCD1234",
            clientEmail: "client@example.com",
            status: "pending",
            title: "Porte claquée",
            createdAt: "2026-06-01T10:00:00.000Z",
          },
        },
      ],
      emailDocs: [
        {
          id: "iv-1",
          data: {
            clientEmail: "client@example.com",
            clientEmailNormalized: "client@example.com",
            status: "pending",
            title: "Porte claquée",
            createdAt: "2026-06-01T10:00:00.000Z",
          },
        },
        {
          id: "iv-2",
          data: {
            clientEmail: "client@example.com",
            clientEmailNormalized: "client@example.com",
            status: "assigned",
            title: "Serrure bloquée",
            createdAt: "2026-05-01T10:00:00.000Z",
          },
        },
      ],
    });

    const result = await verifyPortalAccessAdmin({
      db: db as never,
      code: "ABCD 1234",
    });

    expect(result.emailNormalized).toBe("client@example.com");
    expect(result.interventions.map((row) => row.id)).toEqual(["iv-1", "iv-2"]);
  });

  it("rejette un numéro incorrect", async () => {
    const { db } = buildDbMock({ codeDocs: [], emailDocs: [] });

    await expect(
      verifyPortalAccessAdmin({
        db: db as never,
        code: "ZZZZ9999",
      })
    ).rejects.toThrow("Numéro de dossier incorrect.");
  });
});
