"use client";

import CaseHubLeftRail from "@/features/caseHub/components/CaseHubLeftRail";
import type { CaseHubBucket } from "@/features/caseHub/caseHubTypes";

type Props = {
  bucket: CaseHubBucket;
  counts: Record<CaseHubBucket, number>;
  onBucketChange: (bucket: CaseHubBucket) => void;
};

/** Step 1 — Situation : ce qui m'attend par type d'action. */
export default function CaseHubOverviewPanel({ bucket, counts, onBucketChange }: Props) {
  return (
    <div
      data-testid="case-hub-overview-panel"
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <CaseHubLeftRail bucket={bucket} onBucketChange={onBucketChange} counts={counts} />
    </div>
  );
}
