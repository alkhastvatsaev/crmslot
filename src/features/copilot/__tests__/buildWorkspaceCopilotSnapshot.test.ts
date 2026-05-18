import { buildWorkspaceCopilotSnapshot } from "@/features/copilot/buildWorkspaceCopilotSnapshot";
import type { Intervention } from "@/features/interventions/types";

function iv(partial: Partial<Intervention> & { id: string }): Intervention {
  const { id, ...rest } = partial;
  return {
    id,
    title: rest.title ?? "Test",
    address: partial.address ?? "Rue 1",
    time: partial.time ?? "10:00",
    status: partial.status ?? "pending",
    location: rest.location ?? { lat: 0, lng: 0 },
    ...rest,
  } as Intervention;
}

describe("buildWorkspaceCopilotSnapshot", () => {
  it("aggregates status counts and top clients", () => {
    const snapshot = buildWorkspaceCopilotSnapshot({
      locale: "fr",
      companyId: "co-1",
      companyName: "Demo SA",
      companyRole: "admin",
      interventions: [
        iv({ id: "a", status: "pending", urgency: true, clientName: "Alice" }),
        iv({ id: "b", status: "in_progress", clientName: "Alice", paymentStatus: "paid" }),
        iv({ id: "c", status: "done", clientName: "Bob", invoiceAmountCents: 12000 }),
      ],
      pendingOfflineQueue: 2,
      navigatorOnline: true,
    });

    expect(snapshot.summary.totalInterventions).toBe(3);
    expect(snapshot.summary.urgentOpen).toBe(1);
    expect(snapshot.summary.pendingOfflineQueue).toBe(2);
    expect(snapshot.clients.find((c) => c.name === "Alice")?.interventionCount).toBe(2);
    expect(snapshot.interventions).toHaveLength(3);
  });
});
