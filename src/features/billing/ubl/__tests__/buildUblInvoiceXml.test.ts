import {
  buildUblInvoiceXml,
  escapeXml,
  ublInvoiceTotals,
  type UblInvoiceInput,
} from "../buildUblInvoiceXml";

function input(partial: Partial<UblInvoiceInput> = {}): UblInvoiceInput {
  return {
    invoiceNumber: "FAC-2026-00042",
    issueDate: "2026-06-10",
    dueDate: "2026-07-10",
    supplier: {
      name: "MAP Belgique SRL",
      vatNumber: "BE 0123.456.789",
      street: "Rue Haute 1",
      city: "Bruxelles",
      postalZone: "1000",
    },
    customer: { name: "Dupont & Fils", street: "Rue Basse 2, Namur" },
    lines: [
      { description: "Cylindre 30×30", quantity: 2, unitPriceCents: 4500 },
      { description: "Main-d'œuvre", quantity: 1, unitPriceCents: 8000 },
    ],
    payeeIban: "BE71 0961 2345 6769",
    ...partial,
  };
}

describe("escapeXml", () => {
  it("échappe les 5 entités XML", () => {
    expect(escapeXml(`<a & "b" 'c'>`)).toBe("&lt;a &amp; &quot;b&quot; &apos;c&apos;&gt;");
  });
});

describe("ublInvoiceTotals", () => {
  it("calcule HT / TVA / TTC en centimes", () => {
    const { netCents, vatCents, grossCents } = ublInvoiceTotals(input().lines, 6);
    expect(netCents).toBe(17000);
    expect(vatCents).toBe(1020);
    expect(grossCents).toBe(18020);
  });
});

describe("buildUblInvoiceXml", () => {
  const xml = buildUblInvoiceXml(input());

  it("conforme BIS Billing 3.0 (CustomizationID + ProfileID + type 380)", () => {
    expect(xml).toContain(
      "urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0"
    );
    expect(xml).toContain("urn:fdc:peppol.eu:2017:poacc:billing:01:1.0");
    expect(xml).toContain("<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>");
    expect(xml).toContain("<cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>");
  });

  it("inclut numéro légal et dates", () => {
    expect(xml).toContain("<cbc:ID>FAC-2026-00042</cbc:ID>");
    expect(xml).toContain("<cbc:IssueDate>2026-06-10</cbc:IssueDate>");
    expect(xml).toContain("<cbc:DueDate>2026-07-10</cbc:DueDate>");
  });

  it("TVA normalisée sans espaces ni points", () => {
    expect(xml).toContain("<cbc:CompanyID>BE0123456789</cbc:CompanyID>");
  });

  it("IBAN sans espaces + code virement 30", () => {
    expect(xml).toContain("<cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>");
    expect(xml).toContain("<cbc:ID>BE71096123456769</cbc:ID>");
  });

  it("totaux corrects", () => {
    expect(xml).toContain('<cbc:TaxAmount currencyID="EUR">10.20</cbc:TaxAmount>');
    expect(xml).toContain(
      '<cbc:TaxInclusiveAmount currencyID="EUR">180.20</cbc:TaxInclusiveAmount>'
    );
    expect(xml).toContain('<cbc:PayableAmount currencyID="EUR">180.20</cbc:PayableAmount>');
  });

  it("une InvoiceLine par ligne avec montants", () => {
    expect(xml.match(/<cac:InvoiceLine>/g)).toHaveLength(2);
    expect(xml).toContain(
      '<cbc:LineExtensionAmount currencyID="EUR">90.00</cbc:LineExtensionAmount>'
    );
    expect(xml).toContain("<cbc:Name>Cylindre 30×30</cbc:Name>");
  });

  it("échappe les caractères spéciaux du client", () => {
    expect(xml).toContain("<cbc:RegistrationName>Dupont &amp; Fils</cbc:RegistrationName>");
  });

  it("sans IBAN → pas de PaymentMeans", () => {
    const noIban = buildUblInvoiceXml(input({ payeeIban: null }));
    expect(noIban).not.toContain("PaymentMeans");
  });
});
