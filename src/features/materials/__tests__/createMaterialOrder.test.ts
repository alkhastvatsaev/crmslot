import { createMaterialOrder } from "@/features/materials/createMaterialOrder";
import { createMaterialOrderDoc } from "@/features/materials/materialOrderFirestore";
import { transitionInterventionStatus } from "@/features/interventions/workflow/transitionInterventionStatus";
import { technicianTransitionActor } from "@/features/interventions/workflow/workflowActor";

jest.mock("@/features/materials/materialOrderFirestore", () => ({
  createMaterialOrderDoc: jest.fn(),
}));

jest.mock("@/features/interventions/workflow/transitionInterventionStatus", () => ({
  transitionInterventionStatus: jest.fn(),
}));

const mockCreateDoc = createMaterialOrderDoc as jest.MockedFunction<typeof createMaterialOrderDoc>;
const mockTransition = transitionInterventionStatus as jest.MockedFunction<typeof transitionInterventionStatus>;

const baseIntervention = {
  id: "iv-1",
  status: "in_progress" as const,
  companyId: "co-1",
  assignedTechnicianUid: "tech-1",
  createdByUid: "client-1",
};

describe("createMaterialOrder", () => {
  beforeEach(() => {
    mockCreateDoc.mockReset();
    mockTransition.mockReset();
    mockCreateDoc.mockResolvedValue("order-abc");
    mockTransition.mockResolvedValue({ id: "event-1" } as any);
  });

  it("creates order doc and transitions to waiting_material when in progress", async () => {
    const db = {} as Parameters<typeof createMaterialOrder>[0]["db"];
    const orderId = await createMaterialOrder({
      db,
      intervention: baseIntervention,
      technicianUid: "tech-1",
      partsRequested: [{ description: "Cylindre", quantity: 1 }],
      urgency: "normal",
      actor: technicianTransitionActor("tech-1"),
    });

    expect(orderId).toBe("order-abc");
    expect(mockCreateDoc).toHaveBeenCalledWith(db, {
      interventionId: "iv-1",
      companyId: "co-1",
      technicianUid: "tech-1",
      partsRequested: [{ description: "Cylindre", quantity: 1 }],
      urgency: "normal",
    });
    expect(mockTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        interventionId: "iv-1",
        toStatus: "waiting_material",
        note: expect.stringContaining("Cylindre"),
      }),
    );
  });

  it("skips status transition when setWaitingMaterial is false", async () => {
    const db = {} as Parameters<typeof createMaterialOrder>[0]["db"];
    await createMaterialOrder({
      db,
      intervention: baseIntervention,
      technicianUid: "tech-1",
      partsRequested: [{ description: "Joint", quantity: 2 }],
      urgency: "high",
      actor: technicianTransitionActor("tech-1"),
      setWaitingMaterial: false,
    });

    expect(mockTransition).not.toHaveBeenCalled();
  });

  it("does not transition when intervention is not in_progress", async () => {
    const db = {} as Parameters<typeof createMaterialOrder>[0]["db"];
    await createMaterialOrder({
      db,
      intervention: { ...baseIntervention, status: "waiting_material" },
      technicianUid: "tech-1",
      partsRequested: [{ description: "Poignée", quantity: 1 }],
      urgency: "low",
      actor: technicianTransitionActor("tech-1"),
    });

    expect(mockTransition).not.toHaveBeenCalled();
  });
});
