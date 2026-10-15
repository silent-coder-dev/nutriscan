import React from 'react';
import { VegStatus } from '@/types/product';

interface VegBadgeProps {
  status?: VegStatus | null;
  // "mark" = the symbol only (for lists), "full" = symbol + label
  variant?: 'mark' | 'full';
}

// FSSAI-style marks: green circle in a square for veg, brown triangle in a square for non-veg
export function VegMark({ status, size = 16 }: { status: 'VEG' | 'NON_VEG'; size?: number }) {
  const colour = status === 'VEG' ? '#1e8e3e' : '#7b3f1d';
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      <rect x="1" y="1" width="14" height="14" rx="2" fill="#fff" stroke={colour} strokeWidth="1.6" />
      {status === 'VEG' ? (
        <circle cx="8" cy="8" r="3.6" fill={colour} />
      ) : (
        <path d="M8 4.2 L11.8 11.2 L4.2 11.2 Z" fill={colour} />
      )}
    </svg>
  );
}

export default function VegBadge({ status, variant = 'full' }: VegBadgeProps) {
  if (status !== 'VEG' && status !== 'NON_VEG') return null;
  const label = status === 'VEG' ? 'Veg' : 'Non-veg';

  if (variant === 'mark') {
    return (
      <span title={label} aria-label={label} role="img" className="inline-flex">
        <VegMark status={status} size={14} />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 pl-1 pr-2.5 h-7 rounded-full border text-[12px] font-semibold ${
        status === 'VEG' ? 'border-[#1e8e3e]/40 text-[#1e6e33] bg-[#1e8e3e]/8' : 'border-[#7b3f1d]/40 text-[#7b3f1d] bg-[#7b3f1d]/8'
      }`}
      title="Worked out from the ingredients list. Check the pack to be sure."
    >
      <VegMark status={status} />
      {label}
    </span>
  );
}
