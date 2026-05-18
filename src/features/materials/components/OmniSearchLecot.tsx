"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, Package } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";

// Mock catalogue Lecot (À remplacer par l'API réelle)
const LECOT_MOCK_CATALOG = [
  { ref: "LEC-1001", name: "Vis à bois tête fraisée 4x40mm (Boîte 200)", price: 12.5 },
  { ref: "LEC-1002", name: "Vis à bois tête fraisée 5x60mm (Boîte 200)", price: 18.0 },
  { ref: "LEC-2001", name: "Serrure multipoints à encastrer 3 points", price: 145.0 },
  { ref: "LEC-2002", name: "Serrure en applique monopoint", price: 45.0 },
  { ref: "LEC-3001", name: "Cylindre européen de sécurité 30x30", price: 35.0 },
  { ref: "LEC-3002", name: "Cylindre européen débrayable 40x40", price: 55.0 },
  { ref: "LEC-4001", name: "Poignée de porte sur rosace Inox", price: 25.0 },
  { ref: "LEC-5001", name: "Mousse expansive polyuréthane 750ml", price: 9.5 },
  { ref: "LEC-5002", name: "Silicone neutre transparent 310ml", price: 6.5 },
];

export interface LecotProduct {
  ref: string;
  name: string;
  price?: number;
}

interface OmniSearchLecotProps {
  onSelectProduct: (product: LecotProduct) => void;
  placeholder?: string;
}

/**
 * OmniSearchLecot
 * Barre de recherche ultra-rapide pré-filtrée pour le catalogue matériel.
 */
export default function OmniSearchLecot({ onSelectProduct, placeholder }: OmniSearchLecotProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LecotProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    // Simuler une recherche réseau / debounce
    const timer = setTimeout(() => {
      const q = query.toLowerCase();
      const filtered = LECOT_MOCK_CATALOG.filter(
        (p) => p.name.toLowerCase().includes(q) || p.ref.toLowerCase().includes(q)
      );
      setResults(filtered);
      setIsOpen(true);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (product: LecotProduct) => {
    onSelectProduct(product);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || String(t("materials.form.search_lecot_placeholder"))}
          className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-blue-100 bg-blue-50/30 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all font-medium outline-none"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 w-5 h-5 text-blue-500 animate-spin" />
        )}
      </div>

      {/* Résultats */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-64 overflow-y-auto">
          {results.map((product) => (
            <button
              key={product.ref}
              onClick={() => handleSelect(product)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                <Package className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800 text-[14px] truncate">{product.name}</div>
                <div className="text-[12px] text-slate-500 font-mono mt-0.5">{product.ref}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && results.length === 0 && !isSearching && query.trim().length >= 2 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-4 text-center">
          <p className="text-[14px] font-medium text-slate-500">Aucun produit trouvé pour &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  );
}
