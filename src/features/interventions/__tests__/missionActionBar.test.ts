import { resolveMissionActionBar } from "@/features/interventions/missionActionBar";
import type { Intervention } from "@/features/interventions/types";

function iv(status: Intervention["status"]): Intervention {
  return { status } as Intervention;
}

describe("resolveMissionActionBar", () => {
  it("returns no primary for assigned awaiting response", () => {
    const config = resolveMissionActionBar(iv("assigned"), { awaitingAssignment: true });
    expect(config.primary).toBeNull();
    expect(config.showQuickRow).toBe(false);
  });

  it("maps en_route to on-site transition", () => {
    const config = resolveMissionActionBar(iv("en_route"));
    expect(config.primary).toMatchObject({
      kind: "transition",
      toStatus: "in_progress",
      testId: "mission-action-primary-on-site",
    });
  });

  it("maps in_progress to finish", () => {
    const config = resolveMissionActionBar(iv("in_progress"));
    expect(config.primary).toMatchObject({ kind: "finish" });
    expect(config.canMaterials).toBe(true);
  });

  it("maps waiting_material to resume", () => {
    const config = resolveMissionActionBar(iv("waiting_material"));
    expect(config.primary).toMatchObject({
      kind: "transition",
      toStatus: "in_progress",
    });
  });

  it("hides bar for done missions", () => {
    const config = resolveMissionActionBar(iv("done"));
    expect(config.primary).toBeNull();
    expect(config.showQuickRow).toBe(false);
  });
});
