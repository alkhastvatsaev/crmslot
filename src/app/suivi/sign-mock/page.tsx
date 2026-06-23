import type { Metadata } from "next";
import { Suspense } from "react";
import { PortalSignMockClient } from "@/features/esign";

export const metadata: Metadata = {
  title: "Signature — CRMSLOT",
};

export default function PortalSignMockPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <Suspense fallback={<p className="text-center text-sm text-slate-500">…</p>}>
        <PortalSignMockClient />
      </Suspense>
    </main>
  );
}
