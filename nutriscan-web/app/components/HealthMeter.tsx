'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface HealthMeterProps {
  sugars: number | null;
  fat: number | null;
  sodium: number | null;
  calories?: number | null;
}

interface MetricBarProps {
  label: string;
  value: number | null;
  maxLimit: number;
  note: string;
  index: number;
}

const isKnown = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n);

function MetricBar({ label, value, maxLimit, note, index }: MetricBarProps) {
  const known = isKnown(value);
  const percentage = known ? Math.min(Math.round((Math.max(value, 0) / maxLimit) * 100), 100) : 0;

  let tone = { bar: 'bg-river', text: 'text-river', status: 'Low' };
  if (!known) {
    tone = { bar: 'bg-line-strong', text: 'text-dim', status: 'No data' };
  } else if (percentage > 40 && percentage <= 75) {
    tone = { bar: 'bg-sun', text: 'text-sun', status: 'Moderate' };
  } else if (percentage > 75) {
    tone = { bar: 'bg-clay', text: 'text-clay', status: 'High' };
  }

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-semibold">
          {label}
          <span className="ml-2 font-mono text-[12px] font-normal text-muted">
            {known ? `${Number(value.toFixed(2))} g` : '—'} of {maxLimit} g
          </span>
        </p>
        <p className={`font-mono text-[12px] font-bold uppercase tracking-wider ${tone.text}`}>
          {known ? `${percentage}% · ${tone.status}` : tone.status}
        </p>
      </div>

      <div
        className="mt-2 h-3 rounded-full bg-raised overflow-hidden"
        role="meter"
        aria-label={`${label}: ${percentage}% of the daily limit`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <motion.div
          className={`h-full rounded-full ${tone.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ delay: 0.15 + index * 0.12, duration: 0.7, ease: 'easeOut' }}
        />
      </div>
      <p className="text-[12px] text-dim mt-1.5">{note}</p>
    </div>
  );
}

export default function HealthMeter({ sugars, fat, sodium }: HealthMeterProps) {
  // Reference limits for an adult: free sugars 50 g (WHO), total fat 70 g (EU RI), salt 5 g (WHO)
  const salt = isKnown(sodium) ? sodium * 2.5 : null;

  return (
    <section className="panel p-6 sm:p-7">
      <p className="eyebrow">Daily impact</p>
      <h3 className="display text-[26px] leading-tight mt-1">How much of your day is 100 g?</h3>

      <div className="divide-y divide-line mt-5">
        <MetricBar index={0} label="Sugars" value={sugars} maxLimit={50} note="WHO advises under 50 g of free sugars a day." />
        <MetricBar index={1} label="Fat" value={fat} maxLimit={70} note="Reference intake is 70 g a day (20 g saturates)." />
        <MetricBar index={2} label="Salt" value={salt} maxLimit={5} note="Estimated from sodium (× 2.5). WHO cap is 5 g a day." />
      </div>
    </section>
  );
}
