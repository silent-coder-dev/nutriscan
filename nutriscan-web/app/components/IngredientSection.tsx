'use client';

import React, { useState } from 'react';
import { TriangleAlert } from 'lucide-react';

interface IngredientSectionProps {
  allergens: string | null;
  ingredientsText: string | null;
  simplifiedIngredients?: string | null;
}

export default function IngredientSection({
  allergens,
  ingredientsText,
  simplifiedIngredients,
}: IngredientSectionProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const canToggle = Boolean(simplifiedIngredients && ingredientsText && simplifiedIngredients !== ingredientsText);

  if (!allergens && !simplifiedIngredients && !ingredientsText) {
    return null;
  }

  return (
    <section className="panel p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">What&apos;s inside</p>
          <h3 className="display text-[26px] leading-tight mt-1">Ingredients</h3>
        </div>

        {canToggle && (
          <div className="inline-flex p-1 rounded-full bg-bg border border-line text-[12px] font-semibold" role="group" aria-label="Ingredient wording">
            {([
              [false, 'Plain English'],
              [true, 'As printed'],
            ] as const).map(([value, label]) => (
              <button
                key={label}
                type="button"
                aria-pressed={showOriginal === value}
                onClick={() => setShowOriginal(value)}
                className={`px-3.5 h-8 rounded-full cursor-pointer transition-colors ${
                  showOriginal === value ? 'bg-leaf text-bg' : 'text-muted hover:text-fg'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {allergens && (
        <p className="mt-5 flex items-start gap-2.5 rounded-xl bg-clay/8 border border-clay/35 px-4 py-3 text-[14px]">
          <TriangleAlert className="w-4 h-4 text-clay shrink-0 mt-0.5" />
          <span>
            <span className="font-semibold text-clay">Allergens: </span>
            {allergens}
          </span>
        </p>
      )}

      {(simplifiedIngredients || ingredientsText) && (
        <p
          className={`mt-5 leading-relaxed ${
            showOriginal ? 'font-mono text-[13px] text-muted' : 'text-[16px] text-fg/90'
          }`}
        >
          {showOriginal ? ingredientsText : simplifiedIngredients || ingredientsText}
        </p>
      )}
    </section>
  );
}
