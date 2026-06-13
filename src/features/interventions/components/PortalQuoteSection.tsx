"use client";

import PortalQuotePanel from "@/features/quotes/components/PortalQuotePanel";
import type { PortalQuoteSummary } from "@/features/quotes/portalQuoteSummary";

type Props = {
  portalToken: string;
  quotes: PortalQuoteSummary[];
};

export default function PortalQuoteSection({ portalToken, quotes }: Props) {
  return <PortalQuotePanel portalToken={portalToken} quotes={quotes} />;
}
