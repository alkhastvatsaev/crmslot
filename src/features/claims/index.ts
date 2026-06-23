/**
 * API publique claims — réclamations SAV Firestore companies/{id}/claims.
 */
export type { Claim, ClaimStatus, ClaimCategory } from "@/features/claims/types";
export {
  CLAIM_STATUS_LABELS,
  CLAIM_CATEGORY_LABELS,
  CLAIM_STATUS_STYLES,
} from "@/features/claims/types";
export {
  subscribeClaims,
  subscribeClaimsByIntervention,
  createClaim,
  updateClaimStatus,
} from "@/features/claims/claimsFirestore";
