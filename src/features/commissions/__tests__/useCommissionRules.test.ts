import { renderHook, waitFor } from "@/test-utils/render";
import { useCommissionRules } from "@/features/commissions/useCommissionRules";
import { subscribeCommissionRules } from "@/features/commissions/commissionFirestore";

jest.mock("@/core/config/firebase", () => ({
  firestore: {},
}));

jest.mock("@/features/commissions/commissionFirestore", () => ({
  subscribeCommissionRules: jest.fn(),
}));

const subscribeCommissionRulesMock = subscribeCommissionRules as jest.MockedFunction<
  typeof subscribeCommissionRules
>;

describe("useCommissionRules", () => {
  beforeEach(() => {
    subscribeCommissionRulesMock.mockReset();
  });

  it("ne reste pas en loading après un premier snapshot synchrone", async () => {
    subscribeCommissionRulesMock.mockImplementation((_db, _companyId, onRows) => {
      onRows([]);
      return jest.fn();
    });

    const { result } = renderHook(() => useCommissionRules("co-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rules).toEqual([]);
  });
});
