/**
 * @jest-environment node
 */

import { POST } from "../esign/route";

jest.mock("@/core/config/firebase-admin", () => ({
  getAdminDb: jest.fn(),
}));

const { getAdminDb } = jest.requireMock("@/core/config/firebase-admin") as {
  getAdminDb: jest.Mock;
};

describe("POST /api/webhooks/esign", () => {
  beforeEach(() => {
    Object.defineProperty(process.env, "NODE_ENV", { value: "test", configurable: true });
    delete process.env.ESIGN_WEBHOOK_SECRET;
  });

  it("rejette si requestId ne correspond pas", async () => {
    getAdminDb.mockReturnValue({
      collection: () => ({
        doc: () => ({
          get: async () => ({
            exists: true,
            data: () => ({
              remoteSignRequestId: "req-abc",
              remoteSignStatus: "pending",
            }),
          }),
        }),
      }),
    });

    const req = new Request("http://localhost/api/webhooks/esign", {
      method: "POST",
      headers: { "x-esign-signature": "dev" },
      body: JSON.stringify({
        interventionId: "iv-1",
        requestId: "req-wrong",
        status: "signed",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
