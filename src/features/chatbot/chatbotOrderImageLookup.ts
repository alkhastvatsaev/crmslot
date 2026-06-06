import type { LecotImageLookupInput } from "@/features/catalog/lecotProductImageTypes";
import {
  matchStockCatalogImageLookup,
  resolveOrderLineImageLookup,
} from "@/features/catalog/matchStockCatalogImageLookup";
import type { MaterialOrderDoc } from "@/features/materials/materialOrderFirestore";
import type { SupplierOrder, SupplierOrderLine } from "@/features/suppliers/types";

export type ChatbotOrderImageLookup = LecotImageLookupInput & {
  orderId: string;
};

function lineLookupFields(line: SupplierOrderLine) {
  return {
    sku: line.sku,
    label: line.label,
  };
}

function partLookupFields(part: MaterialOrderDoc["partsRequested"][number]) {
  return {
    reference: part.reference,
    description: part.description,
    label: part.description,
  };
}

function buildLookupFromFields(
  orderId: string,
  fields: {
    sku?: string | null;
    label?: string | null;
    description?: string | null;
    reference?: string | null;
  }
): ChatbotOrderImageLookup {
  const resolved = resolveOrderLineImageLookup({ ...fields, fallbackId: orderId });
  const label = fields.label?.trim() || fields.description?.trim();
  return {
    orderId,
    ...resolved,
    description: label || resolved.description,
  };
}

export function buildSupplierOrderImageLookup(order: SupplierOrder): ChatbotOrderImageLookup {
  for (const line of order.lines) {
    if (line.imageUrl?.trim()) {
      return {
        orderId: order.id,
        reference: line.sku || line.label,
        description: line.label?.trim() || undefined,
        lecotSku: /^lec-/i.test(line.sku) ? line.sku : null,
        imageUrl: line.imageUrl.trim(),
      };
    }
    const matched = matchStockCatalogImageLookup(lineLookupFields(line));
    if (matched) {
      return {
        orderId: order.id,
        ...matched,
        description: line.label?.trim() || matched.description,
      };
    }
  }

  const first = order.lines[0];
  return buildLookupFromFields(order.id, first ? lineLookupFields(first) : {});
}

export function buildMaterialOrderImageLookup(order: MaterialOrderDoc): ChatbotOrderImageLookup {
  for (const part of order.partsRequested) {
    const matched = matchStockCatalogImageLookup(partLookupFields(part));
    if (matched) {
      return {
        orderId: order.id,
        ...matched,
        description: part.description?.trim() || matched.description,
      };
    }
  }

  const first = order.partsRequested[0];
  return buildLookupFromFields(order.id, first ? partLookupFields(first) : {});
}

export function buildChatbotOrderImageLookups(
  supplierOrders: SupplierOrder[],
  materialOrders: MaterialOrderDoc[]
): ChatbotOrderImageLookup[] {
  return [
    ...supplierOrders.map(buildSupplierOrderImageLookup),
    ...materialOrders.map(buildMaterialOrderImageLookup),
  ];
}
