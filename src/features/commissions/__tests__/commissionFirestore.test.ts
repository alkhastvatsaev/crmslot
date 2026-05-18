import { addDoc, collection } from "firebase/firestore";
import { appendCommissionAuditEntry } from "@/features/commissions/commissionFirestore";

const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockCollection = collection as jest.MockedFunction<typeof collection>;

describe("appendCommissionAuditEntry", () => {
  beforeEach(() => {
    mockAddDoc.mockClear();
    mockAddDoc.mockResolvedValue({ id: "audit-1" } as never);
    mockCollection.mockReturnValue("commission_audit" as never);
  });

  it("writes calculated audit row", async () => {
    const db = {} as never;
    await appendCommissionAuditEntry(db, {
      companyId: "co-1",
      interventionId: "iv-1",
      action: "calculated",
      finalCommissionAmount: 33.5,
      byUid: "staff-1",
    });
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    const payload = mockAddDoc.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(payload.action).toBe("calculated");
    expect(payload.finalCommissionAmount).toBe(33.5);
    expect(payload.byUid).toBe("staff-1");
  });

  it("skips write when companyId empty", async () => {
    await appendCommissionAuditEntry({} as never, {
      companyId: "  ",
      interventionId: "iv-1",
      action: "override",
      finalCommissionAmount: 10,
      byUid: "staff-1",
      reason: "Bonus",
    });
    expect(mockAddDoc).not.toHaveBeenCalled();
  });
});
