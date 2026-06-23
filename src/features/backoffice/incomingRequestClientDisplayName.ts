import type { Intervention } from "@/features/interventions";
import { capitalizeName } from "@/utils/stringUtils";
import { guessGenderPrefixFromName } from "@/utils/genderDetection";

export function formatIncomingRequestClientName(
  req: Pick<Intervention, "clientFirstName" | "clientLastName" | "clientName">,
  anonymousLabel: string
): string {
  let fName = req.clientFirstName;
  let lName = req.clientLastName;
  if (!fName && !lName && req.clientName) {
    const parts = req.clientName.trim().split(" ");
    fName = parts[0];
    lName = parts.slice(1).join(" ");
  }
  const prefix = fName ? guessGenderPrefixFromName(fName) : "";
  const displayLName = capitalizeName(lName || fName || "");
  return `${prefix} ${displayLName}`.trim() || anonymousLabel;
}
