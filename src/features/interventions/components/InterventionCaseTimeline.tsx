"use client";

import { CentralizedTimeline } from "@/features/communications/components/CentralizedTimeline";
import { useInterventionTimeline } from "@/features/interventions/timeline/useInterventionTimeline";

type Props = {
  interventionId: string | null;
  companyId?: string | null;
  /** Notes internes uniquement (back-office). */
  allowComments?: boolean;
  clientVisibleOnly?: boolean;
  className?: string;
};

export default function InterventionCaseTimeline({
  interventionId,
  companyId = null,
  allowComments = true,
  clientVisibleOnly = false,
  className,
}: Props) {
  const { events, loading, addComment } = useInterventionTimeline(interventionId, {
    companyId,
    clientVisibleOnly,
  });

  if (!interventionId) {
    return (
      <section
        data-testid="intervention-case-timeline-empty-id"
        className={className}
        aria-hidden
      />
    );
  }

  return (
    <div data-testid="intervention-case-timeline" className={className}>
      <CentralizedTimeline
        events={events}
        isLoading={loading}
        onAddComment={allowComments ? addComment : undefined}
      />
    </div>
  );
}
