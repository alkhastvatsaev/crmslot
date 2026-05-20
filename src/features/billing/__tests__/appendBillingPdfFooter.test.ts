/** @jest-environment node */

import { TextEncoder, TextDecoder } from "util";

Object.assign(global, { TextEncoder, TextDecoder });

import { jsPDF } from "jspdf";
import { appendBillingPdfFooter } from "@/features/billing/appendBillingPdfFooter";
import { formatBillingPdfDate } from "@/features/billing/appendBillingPdfFooter";
import { defaultBillingPdfBranding } from "@/features/billing/generateQuotePdf";

describe("appendBillingPdfFooter", () => {
  it("formats belgian date with place", () => {
    const s = formatBillingPdfDate(new Date("2026-05-18T12:00:00Z"), "Bruxelles");
    expect(s).toMatch(/^Bruxelles, le /);
  });

  it("adds footer content to pdf", () => {
    const doc = new jsPDF();
    appendBillingPdfFooter(doc, 80, defaultBillingPdfBranding("Test SRL"));
    const bytes = new Uint8Array(doc.output("arraybuffer"));
    expect(bytes.byteLength).toBeGreaterThan(800);
  });
});
