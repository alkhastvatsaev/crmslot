"use client";

import { Archive, CheckCircle2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { HubActionBar, HubButton } from "@/core/ui/hub";
import type { Intervention } from "@/features/interventions";
import type { BridgedTechnicianReport } from "@/context/TechnicianBackofficeReportBridgeContext";

type Props = {
  report: BridgedTechnicianReport;
  iv: Intervention | null;
  rejectOpen: boolean;
  isAlreadyValidated: boolean;
  canArchiveReport: boolean;
  rejectReportLabel: string;
  verifyReportLabel: string;
  alreadyVerifiedLabel: string;
  verifyReportAria: string;
  archiveReportLabel: string;
  archiveReportAria: string;
  onOpenReject: () => void;
  onVerify: (id: string) => void;
  onArchiveReport: (id: string) => void;
};

export default function TerrainReportActionBar({
  report: r,
  iv,
  rejectOpen,
  isAlreadyValidated,
  canArchiveReport,
  rejectReportLabel,
  verifyReportLabel,
  alreadyVerifiedLabel,
  verifyReportAria,
  archiveReportLabel,
  archiveReportAria,
  onOpenReject,
  onVerify,
  onArchiveReport,
}: Props) {
  return (
    <HubActionBar>
      {!rejectOpen && !isAlreadyValidated && iv ? (
        <HubButton type="button" data-testid="backoffice-reject-report-btn" onClick={onOpenReject}>
          <RotateCcw className="h-4 w-4" />
          {rejectReportLabel}
        </HubButton>
      ) : null}

      <HubButton
        type="button"
        variant="success"
        emphasis
        data-testid={`backoffice-bridged-report-validate-${r.localId}`}
        disabled={!iv || isAlreadyValidated}
        onClick={() => void onVerify(r.interventionId)}
        className={cn(
          isAlreadyValidated &&
            "cursor-not-allowed bg-emerald-100 text-emerald-700 opacity-70 shadow-none hover:bg-emerald-100",
          !iv && "cursor-not-allowed bg-slate-100 text-slate-400 shadow-none hover:bg-slate-100"
        )}
        aria-label={verifyReportAria}
      >
        <CheckCircle2 className="h-4 w-4" />
        {isAlreadyValidated ? alreadyVerifiedLabel : verifyReportLabel}
      </HubButton>

      {canArchiveReport && !rejectOpen ? (
        <HubButton
          type="button"
          variant="secondary"
          data-testid={`backoffice-bridged-report-archive-${r.localId}`}
          onClick={() => void onArchiveReport(r.interventionId)}
          aria-label={archiveReportAria}
        >
          <Archive className="h-4 w-4" />
          {archiveReportLabel}
        </HubButton>
      ) : null}
    </HubActionBar>
  );
}
