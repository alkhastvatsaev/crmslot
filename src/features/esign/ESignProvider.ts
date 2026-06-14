export type ESignRequest = {
  interventionId: string;
  documentType: "quote" | "report";
  signerEmail: string;
  signerName: string;
};

export type ESignResult = {
  ok: boolean;
  requestId: string;
  signUrl: string;
  status: "pending" | "signed" | "declined";
};

export interface ESignProvider {
  createSignRequest(req: ESignRequest): Promise<ESignResult>;
  getStatus(requestId: string): Promise<ESignResult["status"]>;
}

/** Mock — URL de signature simulée (flag `remoteESign`). */
export class MockESignProvider implements ESignProvider {
  async createSignRequest(req: ESignRequest): Promise<ESignResult> {
    const requestId = `mock-sign-${req.interventionId}-${Date.now()}`;
    return {
      ok: true,
      requestId,
      signUrl: `/suivi/sign-mock?request=${encodeURIComponent(requestId)}`,
      status: "pending",
    };
  }

  async getStatus(requestId: string): Promise<ESignResult["status"]> {
    void requestId;
    return "pending";
  }
}

export function getESignProvider(): ESignProvider {
  return new MockESignProvider();
}
