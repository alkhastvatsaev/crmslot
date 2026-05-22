/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { useCrmActivityFeed } from "../useCrmActivityFeed";

jest.mock("@/features/backoffice/useBackOfficeInterventions", () => ({
  useBackOfficeInterventions: () => ({
    interventions: [
      {
        id: "iv-1",
        title: "Test",
        status: "new",
        companyId: "demo-local-company",
        createdAt: "2026-01-15T10:00:00.000Z",
      },
    ],
    loading: false,
  }),
}));

jest.mock("@/features/featureHub/hooks/useCompanyMaterialOrdersRecent", () => ({
  useCompanyMaterialOrdersRecent: () => ({ orders: [], loading: false }),
}));

jest.mock("@/features/featureHub/hooks/useCompanySupplierOrdersRecent", () => ({
  useCompanySupplierOrdersRecent: () => ({
    orders: [],
    loading: false,
    error: "Missing or insufficient permissions.",
  }),
}));

jest.mock("../useCompanyEmailsFeed", () => ({
  useCompanyEmailsFeed: () => ({ emails: [], loading: false }),
}));

jest.mock("../useCompanyCommissionsFeed", () => ({
  useCompanyCommissionsFeed: () => ({ rows: [], loading: false }),
}));

jest.mock("../useCompanyStatusEventsFeed", () => ({
  useCompanyStatusEventsFeed: () => ({ events: [], loading: false }),
}));

jest.mock("../useCompanyCrmActivityLog", () => ({
  useCompanyCrmActivityLog: () => ({
    rows: [],
    loading: false,
    error: "Missing or insufficient permissions.",
  }),
}));

jest.mock("../useCompanyIvanaChatFeed", () => ({
  useCompanyIvanaChatFeed: () => ({ messages: [], loading: false }),
}));

describe("useCrmActivityFeed", () => {
  it("hides feedError when interventions still produce events", async () => {
    const { result } = renderHook(() =>
      useCrmActivityFeed("demo-local-company", "all", "all", ""),
    );

    await waitFor(() => {
      expect(result.current.events.length).toBeGreaterThan(0);
      expect(result.current.feedError).toBeNull();
    });
  });
});
