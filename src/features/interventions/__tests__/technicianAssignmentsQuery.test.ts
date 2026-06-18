import {
  fetchTechnicianAssignments,
  technicianAssignmentsFirestoreQuery,
} from "@/features/interventions/technicianAssignmentsQuery";

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => "interventions-col"),
  query: jest.fn((...args: unknown[]) => args),
  where: jest.fn((field: string, op: string, value: string) => ({ field, op, value })),
  getDocs: jest.fn(),
  getDocsFromServer: jest.fn(),
}));

const { getDocs, getDocsFromServer } = jest.requireMock("firebase/firestore") as {
  getDocs: jest.Mock;
  getDocsFromServer: jest.Mock;
};

describe("technicianAssignmentsQuery", () => {
  const db = {} as Parameters<typeof fetchTechnicianAssignments>[0];

  beforeEach(() => {
    jest.clearAllMocks();
    const docs = [
      { id: "iv-1", data: () => ({ status: "assigned", assignedTechnicianUid: "tech-1" }) },
    ];
    getDocs.mockResolvedValue({ docs });
    getDocsFromServer.mockResolvedValue({ docs });
  });

  it("builds assignedTechnicianUid query", () => {
    const q = technicianAssignmentsFirestoreQuery(db, "tech-1");
    expect(q).toEqual([
      "interventions-col",
      { field: "assignedTechnicianUid", op: "==", value: "tech-1" },
    ]);
  });

  it("fetchTechnicianAssignments uses cache by default", async () => {
    const rows = await fetchTechnicianAssignments(db, "tech-1");
    expect(getDocs).toHaveBeenCalled();
    expect(getDocsFromServer).not.toHaveBeenCalled();
    expect(rows[0]?.id).toBe("iv-1");
  });

  it("fetchTechnicianAssignments can force server read", async () => {
    await fetchTechnicianAssignments(db, "tech-1", { fromServer: true });
    expect(getDocsFromServer).toHaveBeenCalled();
  });
});
