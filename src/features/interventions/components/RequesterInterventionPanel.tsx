"use client";

import RequesterInterventionStepperHeader from "@/features/interventions/components/RequesterInterventionStepperHeader";
import RequesterInterventionSteps from "@/features/interventions/components/RequesterInterventionSteps";
import { useRequesterInterventionPanelController } from "@/features/interventions/hooks/useRequesterInterventionPanelController";

export default function RequesterInterventionPanel() {
  const c = useRequesterInterventionPanelController();

  return (
    <div
      data-testid="requester-intervention-panel"
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <RequesterInterventionSteps c={c} />
      </div>
      <footer className="shrink-0 px-8 pb-4 pt-1" data-testid="requester-intervention-stepper">
        <RequesterInterventionStepperHeader />
      </footer>
    </div>
  );
}
