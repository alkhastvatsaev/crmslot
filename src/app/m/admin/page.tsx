import { Suspense } from "react";
import type { Metadata } from "next";
import AdminMobileApp from "@/features/dashboard/components/AdminMobileApp";

export const metadata: Metadata = {
  title: "CRMSLOT Admin",
  description: "Inbox et missions du jour",
};

export default function AdminMobileRoutePage() {
  return (
    <Suspense
      fallback={
        <div
          data-testid="admin-mobile-route-loading"
          className="flex min-h-dvh items-center justify-center bg-slate-50"
          aria-busy="true"
        />
      }
    >
      <AdminMobileApp />
    </Suspense>
  );
}
