export interface BillingLine {
  description: string;
  quantity: number;
  unitPriceCents: number;
  reference?: string;
}

export const emptyBillingLine = (): BillingLine => ({
  description: "",
  quantity: 1,
  unitPriceCents: 0,
  reference: "",
});
