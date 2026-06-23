/**
 * API publique esign — signature portail mock (flag remoteESign).
 */
export type { ESignRequest, ESignResult, ESignProvider } from "@/features/esign/ESignProvider";
export { MockESignProvider, getESignProvider } from "@/features/esign/ESignProvider";
export { parseMockSignRequestId } from "@/features/esign/parseMockSignRequestId";
export { default as PortalSignMockClient } from "@/features/esign/components/PortalSignMockClient";
