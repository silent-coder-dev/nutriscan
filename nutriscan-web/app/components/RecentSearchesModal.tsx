'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { History, Package, Trash2, X } from 'lucide-react';
import { clearRecentSearches, removeRecentSearch, RecentSearch, timeAgo, useRecentSearches } from '@/lib/recent';
import { VegMark } from './VegBadge';

interface RecentSearchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPick: (barcode: string) => void;
}

type Filter = 'ALL' | 'VEG' | 'NON_VEG';

const GRADE_BG: Record<string, string> = { A: '#1e9e45', B: '#85bb2f', C: '#e6b400', D: '#ee8100', E: '#e63e11' };

export default function RecentSearchesModal({ isOpen, ...rest }: RecentSearchesModalProps) {
  if (!isOpen) return null;
  return <RecentSearchesDialog {...rest} />;
}

function Thumb({ item }: { item: RecentSearch }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="w-12 h-12 rounded-xl bg-white border border-line overflow-hidden flex items-center justify-center shrink-0">
      {item.imageUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-contain p-1" onError={() => setFailed(true)} />
      ) : (
        <Package className="w-5 h-5 text-dim" />
      )}
    </span>
  );
}

function RecentSearchesDialog({ onClose, onPick }: Omit<RecentSearchesModalProps, 'isOpen'>) {
  const recents = useRecentSearches();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const counts = {
    ALL: recents.length,
    VEG: recents.filter((r) => r.vegStatus === 'VEG').length,
    NON_VEG: recents.filter((r) => r.vegStatus === 'NON_VEG').length,
  };
  const visible = filter === 'ALL' ? recents : recents.filter((r) => r.vegStatus === filter);

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'VEG', label: 'Veg' },
    { id: 'NON_VEG', label: 'Non-veg' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-fg/45 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="panel shadow-[0_30px_80px_-30px_rgb(31_45_36/0.55)] w-full max-w-lg flex flex-col max-h-[85vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recent-title"
      >
        <div className="px-5 pt-5 pb-4 border-b border-line">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow flex items-center gap-2">
                <History className="w-3.5 h-3.5" />
                On this device
              </p>
              <h3 id="recent-title" className="display text-3xl leading-none mt-1.5">
                Recent searches
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full border border-line-strong flex items-center justify-center hover:bg-fg hover:text-bg hover:border-fg transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {recents.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4" role="group" aria-label="Filter by veg status">
              {FILTERS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={filter === id}
                  onClick={() => setFilter(id)}
                  className={`chip h-8 ${filter === id ? 'chip-on' : ''}`}
                >
                  {id !== 'ALL' && <VegMark status={id} size={13} />}
                  {label}
                  <span className="font-mono text-[11px] opacity-70">{counts[id]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {recents.length === 0 ? (
            <div className="py-14 px-6 text-center">
              <History className="w-8 h-8 text-dim mx-auto" />
              <p className="font-display text-xl font-semibold mt-3">No searches yet</p>
              <p className="text-sm text-muted mt-1">Products you look up will show up here.</p>
            </div>
          ) : visible.length === 0 ? (
            <p className="py-12 px-6 text-center text-muted">
              No {filter === 'VEG' ? 'veg' : 'non-veg'} products in your recent searches.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {visible.map((item) => (
                <li key={item.barcode} className="flex items-center gap-2 pr-3 hover:bg-raised/50 transition-colors">
                  <button
                    type="button"
                    onClick={() => {
                      onPick(item.barcode);
                      onClose();
                    }}
                    className="flex-1 min-w-0 flex items-center gap-3 pl-5 py-3 text-left cursor-pointer"
                  >
                    <Thumb item={item} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        {(item.vegStatus === 'VEG' || item.vegStatus === 'NON_VEG') && <VegMark status={item.vegStatus} size={13} />}
                        <span className="font-semibold truncate">{item.productName}</span>
                      </span>
                      <span className="block text-[12px] text-muted truncate">
                        {item.brand || 'Unbranded'} · {timeAgo(item.searchedAt, now)}
                      </span>
                    </span>
                    <span
                      className="w-7 h-7 rounded-full text-white font-display font-bold text-[12px] flex items-center justify-center shrink-0"
                      style={{ background: GRADE_BG[item.nutriScore] ?? '#6b786e' }}
                      aria-label={`Nutri-Score ${item.nutriScore}`}
                    >
                      {GRADE_BG[item.nutriScore] ? item.nutriScore : '?'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRecentSearch(item.barcode)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-dim hover:text-clay hover:bg-clay/10 transition-colors cursor-pointer shrink-0"
                    aria-label={`Remove ${item.productName} from recent searches`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {recents.length > 0 && (
          <div className="px-5 py-3 border-t border-line bg-bg flex items-center justify-between gap-3">
            <span className="text-[12px] text-muted">Tap a product to check it again.</span>
            <button type="button" onClick={clearRecentSearches} className="btn-danger btn-sm">
              <Trash2 className="w-3.5 h-3.5" />
              Clear all
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
