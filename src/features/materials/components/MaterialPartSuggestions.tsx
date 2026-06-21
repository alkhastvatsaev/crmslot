"use client";

import { useMemo, useState } from "react";
import { Package } from "lucide-react";
import { useCompanyStockImages } from "@/features/featureHub/hooks/useCompanyStockImages";
import type { CatalogMatchedPart } from "@/features/materials/matchStockCatalogItem";
import {
  buildStockCatalogById,
  resolveMaterialSuggestionImageUrl,
  stockItemsForSuggestionImages,
} from "@/features/materials/resolveMaterialSuggestionImage";
import type { StockItem } from "@/features/materials/stockFirestore";

type Props = {
  suggestions: CatalogMatchedPart[];
  stockItems?: StockItem[];
  onOrderPart: (part: CatalogMatchedPart) => void;
};

function SuggestionTile({
  part,
  index,
  imageUrl,
  onOrderPart,
}: {
  part: CatalogMatchedPart;
  index: number;
  imageUrl: string | null;
  onOrderPart: (part: CatalogMatchedPart) => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const label = part.catalogDescription?.trim() || part.description;
  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <li className="min-w-0">
      <button
        type="button"
        data-testid={`material-suggestion-${index}`}
        onClick={() => onOrderPart(part)}
        className="flex w-full flex-col overflow-hidden rounded-[14px] bg-white text-left ring-1 ring-inset ring-slate-100 transition hover:ring-slate-300 active:scale-[0.98]"
      >
        <span
          className="flex aspect-square items-center justify-center bg-slate-50/80 p-2"
          data-testid={`material-suggestion-image-${index}`}
        >
          {showImage ? (
            <img
              src={imageUrl ?? undefined}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <Package className="h-8 w-8 text-slate-300" aria-hidden />
          )}
        </span>
        <span className="space-y-0.5 px-2.5 py-2">
          <span className="line-clamp-2 block text-[12px] font-semibold leading-snug text-slate-900">
            {label}
          </span>
          <span className="block text-[10px] text-slate-500">
            {part.quantity}×
            {part.catalogReference?.trim() || part.reference?.trim()
              ? ` · ${part.catalogReference?.trim() || part.reference?.trim()}`
              : ""}
          </span>
        </span>
      </button>
    </li>
  );
}

export default function MaterialPartSuggestions({
  suggestions,
  stockItems = [],
  onOrderPart,
}: Props) {
  const catalogById = useMemo(() => buildStockCatalogById(stockItems), [stockItems]);
  const itemsForImages = useMemo(
    () => stockItemsForSuggestionImages(suggestions, catalogById),
    [suggestions, catalogById]
  );
  const imageUrls = useCompanyStockImages(itemsForImages);

  const resolvedImages = useMemo(
    () =>
      suggestions.map((part) => resolveMaterialSuggestionImageUrl(part, catalogById, imageUrls)),
    [suggestions, catalogById, imageUrls]
  );

  if (suggestions.length === 0) return null;

  return (
    <div
      data-testid="material-part-suggestions"
      className="rounded-[16px] bg-slate-50 p-2 ring-1 ring-inset ring-slate-100"
    >
      <ul className="grid grid-cols-3 gap-2">
        {suggestions.map((part, index) => (
          <SuggestionTile
            key={`${part.stockItemId ?? part.description}-${index}`}
            part={part}
            index={index}
            imageUrl={resolvedImages[index] ?? null}
            onOrderPart={onOrderPart}
          />
        ))}
      </ul>
    </div>
  );
}
