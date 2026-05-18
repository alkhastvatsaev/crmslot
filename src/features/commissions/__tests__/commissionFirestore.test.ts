import { addDoc, collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { appendCommissionAuditEntry, createManualCommission, subscribeManualCommissions } from "@/features/commissions/commissionFirestore";

const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockOnSnapshot = onSnapshot as jest.MockedFunction<typeof onSnapshot>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>;

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

describe("createManualCommission", () => {
  beforeEach(() => {
    mockAddDoc.mockClear();
    mockAddDoc.mockResolvedValue({ id: "manual-1" } as never);
    mockCollection.mockReturnValue("manual_commissions" as never);
  });

  it("writes manual commission entry and returns id", async () => {
    const id = await createManualCommission({} as never, "co-1", {
      technicianUid: "tech-1",
      amountEuros: 45,
      reason: "Bonus exceptionnel",
      date: "2026-05-18",
      createdByUid: "staff-1",
    });
    expect(id).toBe("manual-1");
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    const payload = mockAddDoc.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(payload.technicianUid).toBe("tech-1");
    expect(payload.amountEuros).toBe(45);
    expect(payload.reason).toBe("Bonus exceptionnel");
  });
});

describe("subscribeManualCommissions", () => {
  beforeEach(() => {
    mockCollection.mockReturnValue("col" as never);
    mockQuery.mockReturnValue("q" as never);
    mockOrderBy.mockReturnValue("orderBy" as never);
    mockOnSnapshot.mockClear();
  });

  it("calls onSnapshot and returns unsub function", () => {
    const unsub = jest.fn();
    mockOnSnapshot.mockReturnValue(unsub as never);
    const cb = jest.fn();
    const result = subscribeManualCommissions({} as never, "co-1", cb);
    expect(mockOnSnapshot).toHaveBeenCalledTimes(1);
    expect(result).toBe(unsub);
  });

  it("returns empty and no-op when companyId is empty", () => {
    const cb = jest.fn();
    const unsub = subscribeManualCommissions({} as never, "", cb);
    expect(cb).toHaveBeenCalledWith([]);
    expect(mockOnSnapshot).not.toHaveBeenCalled();
    unsub();
  });
});
