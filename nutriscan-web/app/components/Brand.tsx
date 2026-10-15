import React from 'react';

const BARS = [3, 1.5, 3, 1.5, 3];

// Leaf-shaped mark: barcode bars inside a leaf (two opposite corners fully rounded)
export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex items-stretch justify-center gap-[2px] bg-leaf shrink-0"
      style={{
        width: size,
        height: size,
        padding: `${size * 0.26}px ${size * 0.24}px`,
        borderRadius: `${size * 0.55}px ${size * 0.12}px`,
      }}
      aria-hidden
    >
      {BARS.map((w, i) => (
        <span key={i} className="bg-bg rounded-[1px]" style={{ width: w * (size / 34) }} />
      ))}
    </span>
  );
}

export default function Brand({ size = 34 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <BrandMark size={size} />
      <span className="font-display text-[22px] font-semibold tracking-[-0.03em] leading-none">
        nutri<span className="text-leaf">scan</span>
      </span>
    </span>
  );
}
