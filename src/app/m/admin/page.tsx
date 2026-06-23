import { redirect } from "next/navigation";

/** Ancienne route satellite — une seule app CRM : `/`. */
export default function AdminMobileLegacyRoute() {
  redirect("/");
}
