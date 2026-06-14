/**
 * Génération UBL 2.1 conforme Peppol BIS Billing 3.0 (EN 16931).
 * Module pur — aucune dépendance réseau ni Firebase.
 */

export type UblParty = {
  name: string;
  vatNumber?: string | null;
  street?: string | null;
  city?: string | null;
  postalZone?: string | null;
  /** ISO 3166-1 alpha-2 — défaut BE. */
  countryCode?: string | null;
};

export type UblInvoiceLine = {
  description: string;
  quantity: number;
  unitPriceCents: number;
};

export type UblInvoiceInput = {
  /** Numéro légal séquentiel (FAC-2026-00042). */
  invoiceNumber: string;
  issueDate: string; // YYYY-MM-DD
  dueDate?: string | null; // YYYY-MM-DD
  supplier: UblParty;
  customer: UblParty;
  lines: UblInvoiceLine[];
  /** Taux TVA en pourcentage (défaut 6 — rénovation/dépannage BE). */
  vatPercent?: number;
  /** IBAN du fournisseur pour le paiement par virement. */
  payeeIban?: string | null;
  note?: string | null;
};

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function money(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function ublInvoiceTotals(lines: UblInvoiceLine[], vatPercent: number) {
  const netCents = lines.reduce((s, l) => s + Math.round(l.quantity * l.unitPriceCents), 0);
  const vatCents = Math.round((netCents * vatPercent) / 100);
  return { netCents, vatCents, grossCents: netCents + vatCents };
}

function partyXml(tag: "AccountingSupplierParty" | "AccountingCustomerParty", p: UblParty): string {
  const country = (p.countryCode ?? "BE").toUpperCase();
  const vat = p.vatNumber?.replace(/[\s.]/g, "") ?? "";
  return `  <cac:${tag}>
    <cac:Party>
      <cac:PostalAddress>
        ${p.street ? `<cbc:StreetName>${escapeXml(p.street)}</cbc:StreetName>` : ""}
        ${p.city ? `<cbc:CityName>${escapeXml(p.city)}</cbc:CityName>` : ""}
        ${p.postalZone ? `<cbc:PostalZone>${escapeXml(p.postalZone)}</cbc:PostalZone>` : ""}
        <cac:Country><cbc:IdentificationCode>${country}</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      ${
        vat
          ? `<cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(vat)}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>`
          : ""
      }
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(p.name)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:${tag}>`;
}

/** Construit le XML UBL 2.1 d'une facture (Peppol BIS Billing 3.0). */
export function buildUblInvoiceXml(input: UblInvoiceInput): string {
  const vatPercent = input.vatPercent ?? 6;
  const { netCents, vatCents, grossCents } = ublInvoiceTotals(input.lines, vatPercent);

  const linesXml = input.lines
    .map((line, idx) => {
      const lineTotal = Math.round(line.quantity * line.unitPriceCents);
      return `  <cac:InvoiceLine>
    <cbc:ID>${idx + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">${line.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">${money(lineTotal)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${escapeXml(line.description)}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>${vatPercent}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="EUR">${money(line.unitPriceCents)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
    })
    .join("\n");

  const paymentMeansXml = input.payeeIban
    ? `  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
    <cac:PayeeFinancialAccount>
      <cbc:ID>${escapeXml(input.payeeIban.replace(/\s/g, ""))}</cbc:ID>
    </cac:PayeeFinancialAccount>
  </cac:PaymentMeans>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>${escapeXml(input.invoiceNumber)}</cbc:ID>
  <cbc:IssueDate>${input.issueDate}</cbc:IssueDate>
  ${input.dueDate ? `<cbc:DueDate>${input.dueDate}</cbc:DueDate>` : ""}
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  ${input.note ? `<cbc:Note>${escapeXml(input.note)}</cbc:Note>` : ""}
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
${partyXml("AccountingSupplierParty", input.supplier)}
${partyXml("AccountingCustomerParty", input.customer)}
${paymentMeansXml}
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="EUR">${money(vatCents)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="EUR">${money(netCents)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="EUR">${money(vatCents)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>${vatPercent}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="EUR">${money(netCents)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">${money(netCents)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">${money(grossCents)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="EUR">${money(grossCents)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
${linesXml}
</Invoice>`;
}
