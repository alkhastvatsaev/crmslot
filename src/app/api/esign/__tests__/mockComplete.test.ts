/** @jest-environment node */

import { POST } from "../mock-complete/route";

jest.mock("@/core/config/firebase-admin", () => ({
  getAdminDb: jest.fn(),
}));

const { getAdminDb } = jest.requireMock("@/core/config/firebase-admin") as {
  getAdminDb: jest.Mock;
};

describe("POST /api/esign/mock-complete", () => {
  it("marque la signature comme signée", async () => {
    const update = jest.fn(async () => {});
    const add = jest.fn(async () => ({}));
    getAdminDb.mockReturnValue({
      collection: () => ({
        doc: () => ({
          get: async () => ({
            exists: true,
            data: () => ({
              remoteSignRequestId: "mock-sign-iv-1-1234567890",
              remoteSignStatus: "pending",
              companyId: "co-1",
            }),
          }),
          update,
          collection: () => ({ add }),
        }),
      }),
    });

    const req = new Request("http://localhost/api/esign/mock-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId: "mock-sign-iv-1-1234567890",
        status: "signed",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ remoteSignStatus: "signed" }));
  });
});
