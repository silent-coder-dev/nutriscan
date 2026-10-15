'use client';

import React from 'react';

interface NutrientGridProps {
  calories: number | null;
  sugars: number | null;
  fat: number | null;
  proteins: number | null;
  sodium?: number | null;
}

const fmt = (n: number | null | undefined, digits = 1) =>
  n == null || Number.isNaN(n) ? '—' : Number(n.toFixed(digits)).toString();

// Styled after the printed "Nutrition Facts" panel on food packaging
export default function NutrientGrid({ calories, sugars, fat, proteins, sodium }: NutrientGridProps) {
  const rows: { label: string; value: string; unit: string; indent?: boolean }[] = [
    { label: 'Total fat', value: fmt(fat), unit: 'g' },
    { label: 'Sugars', value: fmt(sugars), unit: 'g' },
    { label: 'Protein', value: fmt(proteins), unit: 'g' },
    { label: 'Salt (est.)', value: sodium != null ? fmt(sodium * 2.5, 2) : '—', unit: 'g' },
    { label: 'Sodium', value: sodium != null ? fmt(sodium * 1000, 0) : '—', unit: 'mg', indent: true },
  ];

  return (
    <section className="bg-surface border-2 border-fg rounded-xl p-4 shadow-[4px_4px_0_0_var(--color-fg)]" aria-label="Nutrition facts per 100 grams">
      <h3 className="font-display text-[30px] font-bold leading-none tracking-[-0.02em]">Nutrition Facts</h3>
      <p className="text-[12px] text-muted mt-1">Per 100 g (or 100 ml for drinks)</p>

      <div className="h-2.5 bg-fg mt-3" />
      <div className="flex items-end justify-between pt-2">
        <span className="font-bold text-[15px]">Calories</span>
        <span className="font-display text-[40px] font-bold leading-none tabular-nums">{fmt(calories, 0)}</span>
      </div>
      <div className="h-1.5 bg-fg mt-2" />

      <ul>
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between py-2 border-b border-fg/25 last:border-0 text-[14px]">
            <span className={row.indent ? 'pl-4 text-muted' : 'font-bold'}>{row.label}</span>
            <span className="font-mono tabular-nums">
              {row.value}
              {row.value !== '—' && <span className="text-muted ml-0.5">{row.unit}</span>}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-dim mt-2 leading-snug">As declared by the manufacturer.</p>
    </section>
  );
}
