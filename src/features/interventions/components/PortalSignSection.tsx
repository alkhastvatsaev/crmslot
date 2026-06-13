"use client";

import PortalSignPanel from "@/features/esign/components/PortalSignPanel";

type Props = {
  interventionId: string;
  clientName?: string;
  portalToken?: string;
};

export default function PortalSignSection({ interventionId, clientName, portalToken }: Props) {
  return (
    <PortalSignPanel
      interventionId={interventionId}
      clientName={clientName}
      portalToken={portalToken}
    />
  );
}
