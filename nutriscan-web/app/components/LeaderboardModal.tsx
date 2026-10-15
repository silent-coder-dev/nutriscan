'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, RefreshCw, AlertCircle } from 'lucide-react';
import { getLeaderboard, errorMessage, ScoutRank } from '@/lib/api';

const PODIUM = ['bg-sun text-bg', 'bg-fg/85 text-bg', 'bg-[#d08b5b] text-bg'];

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername?: string;
}

export default function LeaderboardModal({ isOpen, ...rest }: LeaderboardModalProps) {
  // Mounted only while open, so every opening starts with a fresh fetch
  if (!isOpen) return null;
  return <LeaderboardDialog {...rest} />;
}

function LeaderboardDialog({ onClose, currentUsername }: Omit<LeaderboardModalProps, 'isOpen'>) {
  const [ranks, setRanks] = useState<ScoutRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getLeaderboard()
      .then((data) => {
        if (cancelled) return;
        setRanks(data);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, 'Could not load the leaderboard.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const refresh = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-fg/45 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="panel shadow-[0_30px_80px_-30px_rgb(31_45_36/0.55)] w-full max-w-lg flex flex-col max-h-[85vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="leaderboard-title"
      >
        <div className="px-5 pt-5 pb-4 border-b border-line">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-clay animate-pulse" />
                Live standings
              </p>
              <h3 id="leaderboard-title" className="display text-3xl leading-none mt-1.5">
                Top scouts
              </h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={refresh}
                disabled={loading}
                className="w-9 h-9 rounded-full border border-line-strong flex items-center justify-center hover:bg-bg transition-colors cursor-pointer"
                aria-label="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full border border-line-strong flex items-center justify-center hover:bg-clay hover:text-bg hover:border-clay transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-2 grid grid-cols-[2.5rem_1fr_auto] gap-3 eyebrow border-b border-dashed border-line">
          <span>#</span>
          <span>Scout</span>
          <span className="text-right">Score</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-5 space-y-2.5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-11 bg-raised rounded-xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-5">
              <div className="notice-error" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0 text-clay mt-0.5" />
                <span>{error}</span>
              </div>
            </div>
          ) : ranks.length === 0 ? (
            <p className="text-center py-14 px-6 text-muted">
              Nobody on the board yet. Scan something new and claim the top spot.
            </p>
          ) : (
            <ol>
              {ranks.map((scout, idx) => {
                const isMe = Boolean(currentUsername) && scout.username.toLowerCase() === currentUsername!.toLowerCase();
                const level = Math.max(1, Math.floor(scout.scoutScore / 50) + 1);

                return (
                  <li
                    key={scout.username}
                    className={`px-5 py-3 grid grid-cols-[2.5rem_1fr_auto] gap-3 items-center border-b border-line ${
                      isMe ? 'bg-leaf/10' : ''
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-display font-bold ${
                        idx < 3 ? `${PODIUM[idx]} rounded-full` : 'text-dim font-mono text-sm'
                      }`}
                    >
                      {idx + 1}
                    </span>

                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="font-semibold truncate">@{scout.username}</span>
                        {isMe && <span className="tag text-clay">You</span>}
                      </span>
                      <span className="block text-[12px] text-muted truncate">
                        {scout.fullName} · Lvl {level}
                      </span>
                    </span>

                    <span className="text-right">
                      <span className="block font-mono font-bold tabular-nums">{scout.scoutScore}</span>
                      <span className="block text-[11px] text-muted">{scout.uniqueDiscoveries} found</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <p className="px-5 py-3 border-t border-line bg-bg font-mono text-[11px] text-muted text-center">
          Points are awarded only for barcodes nobody has logged before.
        </p>
      </motion.div>
    </div>
  );
}
