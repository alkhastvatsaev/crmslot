export type LecotImageLookupInput = {
  reference: string;
  description?: string;
  imageUrl?: string | null;
  /** SKU Lecot réel quand la référence stock interne diffère (ex. CYL-EURO-80 → LEC-CYL-2012). */
  lecotSku?: string | null;
};
