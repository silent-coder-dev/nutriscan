'use client';

import React, { useState } from 'react';
import { ArrowUpRight, BadgeCheck, Package, ScanLine } from 'lucide-react';
import { NutriScore } from '@/types/product';
import { ProductAlternative } from '@/lib/api';

interface ProductAlternativesProps {
  score: NutriScore | null;
  productName: string;
  alternatives: ProductAlternative[];
  category: string | null;
  loading: boolean;
  onPick: (barcode: string) => void;
}

const GRADE_BG: Record<string, string> = { A: '#1e9e45', B: '#85bb2f', C: '#e6b400', D: '#ee8100', E: '#e63e11' };

const offSearchUrl = (terms: string) =>
  `https://world.openfoodfacts.org/search?q=${encodeURIComponent(terms)}&sort_by=nutriscore_score`;

function AlternativeCard({ item, onPick }: { item: ProductAlternative; onPick: (barcode: string) => void }) {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <button
      type="button"
      onClick={() => onPick(item.barcode)}
      className="group text-left panel-raised p-3 flex gap-3 items-center hover:border-leaf hover:bg-surface transition-colors cursor-pointer"
    >
      <span className="w-16 h-16 rounded-xl bg-white border border-line overflow-hidden flex items-center justify-center shrink-0">
        {item.imageUrl && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain p-1"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Package className="w-6 h-6 text-dim" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-full text-white font-display font-bold text-[12px] flex items-center justify-center shrink-0"
            style={{ background: GRADE_BG[item.nutriScore] ?? '#6b786e' }}
            aria-label={`Nutri-Score ${item.nutriScore}`}
          >
            {item.nutriScore === 'UNKNOWN' ? '?' : item.nutriScore}
          </span>
          <span className="text-[12px] text-muted truncate">{item.brand || 'Unbranded'}</span>
        </span>
        <span className="block font-semibold leading-snug mt-1 line-clamp-2">{item.productName}</span>
        <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-leaf opacity-80 group-hover:opacity-100">
          <ScanLine className="w-3.5 h-3.5" />
          Check this one
        </span>
      </span>
    </button>
  );
}

export default function ProductAlternatives({ score, productName, alternatives, category, loading, onPick }: ProductAlternativesProps) {
  if (score === 'A') {
    return (
      <div className="notice-ok rounded-[20px] p-5">
        <BadgeCheck className="w-6 h-6 text-river shrink-0" />
        <div>
          <p className="font-display text-lg font-semibold leading-tight">Already a top pick.</p>
          <p className="text-sm text-muted mt-1 leading-relaxed">
            {productName} has the best Nutri-Score there is. Nothing to swap.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="panel p-6 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Better swaps</p>
          <h3 className="display text-[26px] leading-tight mt-1">
            {category ? `Better-rated ${category.toLowerCase()}` : 'Better-rated alternatives'}
          </h3>
        </div>
        <a
          href={offSearchUrl(category || productName)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted hover:text-leaf transition-colors"
        >
          More on Open Food Facts
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3 mt-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[88px] rounded-2xl bg-raised animate-pulse" />
          ))}
        </div>
      ) : alternatives.length > 0 ? (
        <>
          <div className="grid sm:grid-cols-2 gap-3 mt-5">
            {alternatives.map((item) => (
              <AlternativeCard key={item.barcode} item={item} onPick={onPick} />
            ))}
          </div>
          <p className="text-[12px] text-dim mt-3">Popular products from the same category with a better Nutri-Score.</p>
        </>
      ) : (
        <p className="text-sm text-muted mt-4">
          We couldn&apos;t find better-rated products in this category yet. Try the Open Food Facts link above.
        </p>
      )}
    </section>
  );
}
