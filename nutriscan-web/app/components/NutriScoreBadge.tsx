'use client';

import React from 'react';
import { NutriScore } from '@/types/product';

interface NutriScoreBadgeProps {
  score: NutriScore | null;
}

const GRADES = [
  { letter: 'A', bg: '#1e9e45', fg: '#fff', label: 'Excellent pick' },
  { letter: 'B', bg: '#85bb2f', fg: '#1f2d24', label: 'Good choice' },
  { letter: 'C', bg: '#fecb02', fg: '#1f2d24', label: 'Okay in moderation' },
  { letter: 'D', bg: '#ee8100', fg: '#1f2d24', label: 'High in sugar, salt or fat' },
  { letter: 'E', bg: '#e63e11', fg: '#fff', label: 'Treat, not a staple' },
] as const;

export default function NutriScoreBadge({ score }: NutriScoreBadgeProps) {
  const current = GRADES.find((g) => g.letter === score);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div
        className="flex items-center p-1 gap-1 rounded-full bg-surface border border-line-strong"
        role="img"
        aria-label={current ? `Nutri-Score ${current.letter}` : 'Nutri-Score not available'}
      >
        {GRADES.map((g) => {
          const active = g.letter === score;
          return (
            <span
              key={g.letter}
              className={`flex items-center justify-center rounded-full font-display font-bold transition-all ${
                active ? 'w-11 h-11 text-xl ring-2 ring-fg ring-offset-2 ring-offset-surface' : 'w-7 h-7 text-xs opacity-35'
              }`}
              style={{ background: g.bg, color: g.fg }}
            >
              {g.letter}
            </span>
          );
        })}
      </div>
      <div>
        <p className="eyebrow">Nutri-Score</p>
        <p className="font-display text-lg font-semibold leading-tight mt-0.5">
          {current ? current.label : 'Not graded yet'}
        </p>
      </div>
    </div>
  );
}
