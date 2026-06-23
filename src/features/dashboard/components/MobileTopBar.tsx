"use client";

import AdminMobileProfileChip from "@/features/dashboard/components/AdminMobileProfileChip";
import MobileProfileTopBar from "@/features/dashboard/components/MobileProfileTopBar";

/** Header mobile admin — profil en haut. */
export default function MobileTopBar() {
  return (
    <MobileProfileTopBar>
      <AdminMobileProfileChip />
    </MobileProfileTopBar>
  );
}
