import { render, screen, fireEvent, waitFor } from "@/test-utils/render";
import { CentralizedTimeline } from "@/features/communications/components/CentralizedTimeline";
import type { InterventionEvent } from "@/features/interventions/types";

const sampleEvents: InterventionEvent[] = [
  {
    id: "status-s1",
    interventionId: "iv-1",
    type: "status_change",
    createdAt: "2026-05-17T08:00:00.000Z",
    createdByUid: "u1",
    oldStatus: "pending",
    newStatus: "assigned",
    actorRole: "dispatcher",
  },
  {
    id: "timeline-c1",
    interventionId: "iv-1",
    type: "comment",
    createdAt: "2026-05-17T09:00:00.000Z",
    createdByUid: "u2",
    content: "Note test",
    visibility: "internal",
  },
];

describe("CentralizedTimeline", () => {
  it("renders merged events", () => {
    render(<CentralizedTimeline events={sampleEvents} />);
    expect(screen.getByTestId("centralized-timeline-list")).toBeInTheDocument();
    expect(screen.getByText(/Note test/)).toBeInTheDocument();
  });

  it("submits internal comment", async () => {
    const onAddComment = jest.fn().mockResolvedValue(undefined);
    render(<CentralizedTimeline events={[]} onAddComment={onAddComment} />);

    fireEvent.change(screen.getByTestId("centralized-timeline-comment-input"), {
      target: { value: "Rappeler le client" },
    });
    fireEvent.submit(screen.getByTestId("centralized-timeline-comment-form"));

    await waitFor(() => {
      expect(onAddComment).toHaveBeenCalledWith("Rappeler le client");
    });
  });

  it("hides comment form when onAddComment omitted", () => {
    render(<CentralizedTimeline events={sampleEvents} />);
    expect(screen.queryByTestId("centralized-timeline-comment-form")).not.toBeInTheDocument();
  });
});
