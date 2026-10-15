'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { updateSession, useSession } from '@/lib/auth';
import { getCurrentUser, getScanHistory, errorMessage, ScanHistoryItem } from '@/lib/api';
import { Trophy, ScanLine, ArrowUpRight, Plus, AlertCircle, ArrowLeft } from 'lucide-react';
import VegBadge from '../components/VegBadge';
import LeaderboardModal from '../components/LeaderboardModal';

const VERDICT_STYLE: Record<string, string> = {
  Clean: 'bg-river/10 text-river border-river/40',
  Moderate: 'bg-sun/10 text-sun border-sun/40',
  Avoid: 'bg-clay/10 text-clay border-clay',
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
};

export default function DashboardClient() {
  const session = useSession();
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // Load the scan log and refresh scout stats once per visit
  useEffect(() => {
    let cancelled = false;

    Promise.all([getScanHistory(), getCurrentUser()])
      .then(([scans, me]) => {
        if (cancelled) return;
        setHistory(scans);
        updateSession(me);
      })
      .catch((err) => {
        // A 401 has already signed the user out; the auth guard redirects
        if (!cancelled) setLoadError(errorMessage(err, 'Could not load your scan log.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const scoutScore = session?.scoutScore || 0;
  const scoutLevel = Math.max(1, Math.floor(scoutScore / 50) + 1);
  const nextLevelXp = scoutLevel * 50;
  const progressPercent = Math.min(100, Math.round(((scoutScore % 50) / 50) * 100));
  const firstName = (session?.fullName || 'Scout').split(' ')[0];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-20">
        <Link href="/" className="inline-flex items-center gap-1.5 mb-6 text-[14px] font-semibold text-muted hover:text-leaf transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {/* Greeting */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="eyebrow">Your pantry · @{session?.username || 'user'}</p>
            <h1 className="display text-[44px] sm:text-[56px] leading-[0.95] mt-3">
              Hello, <span className="text-leaf">{firstName}</span>.
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/profile" className="btn-ghost">
              Edit profile
            </Link>
            <button onClick={() => setIsLeaderboardOpen(true)} className="btn-ghost">
              <Trophy className="w-4 h-4 text-sun" />
              Leaderboard
            </button>
            <Link href="/" className="btn-primary">
              <Plus className="w-4 h-4" />
              New scan
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-5 mb-12">
          <div className="relative overflow-hidden rounded-[22px] p-6 bg-leaf text-bg">
            <p className="eyebrow text-bg/60">Scout level</p>
            <div className="flex items-baseline gap-3 mt-3">
              <span className="display text-[64px] leading-none">{scoutLevel}</span>
              <span className="font-mono text-[13px] font-bold">{scoutScore} XP</span>
            </div>
            <div className="mt-5">
              <div className="flex justify-between font-mono text-[11px] text-bg/60 mb-1.5">
                <span>Next level</span>
                <span>{scoutScore} / {nextLevelXp}</span>
              </div>
              <div className="h-2.5 rounded-full bg-bg/15 overflow-hidden">
                <div
                  className="h-full bg-bg rounded-full transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="panel p-6">
            <p className="eyebrow">First discoveries</p>
            <div className="flex items-baseline gap-3 mt-3">
              <span className="display text-[64px] leading-none">{session?.uniqueDiscoveries || 0}</span>
              <span className="text-sm text-muted">products</span>
            </div>
            <p className="text-sm text-muted mt-5 leading-relaxed">
              Be the first to log a barcode and earn <strong className="text-fg">+10 XP</strong>.
            </p>
          </div>

          <div className="panel p-6 flex flex-col">
            <p className="eyebrow">Your guardrails</p>
            <p className="font-display text-2xl font-semibold mt-3 leading-tight">
              {session?.dietaryPreference || 'No diet set'}
            </p>
            <p className="text-sm text-muted mt-1.5 line-clamp-2">
              Allergies: {session?.allergies || 'none declared'}
            </p>
            <Link
              href="/profile"
              className="mt-auto pt-4 inline-flex items-center gap-1 text-[13px] font-semibold hover:text-leaf transition-colors"
            >
              Update preferences
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Scan log */}
        <section>
          <div className="flex items-baseline justify-between gap-4 mb-4">
            <h2 className="display text-3xl">Scan log</h2>
            <span className="eyebrow">{history.length} entries</span>
          </div>

          <div className="panel overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-11 bg-raised rounded-xl animate-pulse" />
                ))}
              </div>
            ) : loadError ? (
              <div className="p-6">
                <div className="notice-error" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0 text-clay mt-0.5" />
                  <span>{loadError}</span>
                </div>
              </div>
            ) : history.length === 0 ? (
              <div className="py-16 px-6 text-center">
                <div className="w-14 h-14 mx-auto rounded-xl border border-dashed border-line flex items-center justify-center mb-4">
                  <ScanLine className="w-6 h-6 text-dim" />
                </div>
                <p className="font-display text-2xl font-semibold">Nothing scanned yet</p>
                <p className="text-muted mt-1.5 mb-6 max-w-sm mx-auto">
                  Grab anything from the cupboard and scan its barcode to start your log.
                </p>
                <Link href="/" className="btn-primary">
                  Scan your first item
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-bg">
                      {['Product', 'Barcode', 'Verdict', 'XP', 'Date'].map((h) => (
                        <th key={h} className="py-3 px-5 eyebrow font-semibold whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.id} className="border-b border-line last:border-0 hover:bg-raised transition-colors">
                        <td className="py-3.5 px-5">
                          <span className="flex items-center gap-1.5 font-semibold">
                            <VegBadge status={item.vegStatus} variant="mark" />
                            {item.productName}
                          </span>
                          <span className="block text-[12px] text-muted">{item.brand || 'Unbranded'}</span>
                        </td>
                        <td className="py-3.5 px-5 font-mono text-[12px] text-muted">{item.barcode}</td>
                        <td className="py-3.5 px-5">
                          <span className={`tag ${VERDICT_STYLE[item.healthVerdict] ?? VERDICT_STYLE.Moderate}`}>
                            {item.healthVerdict}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 font-mono text-[12px] whitespace-nowrap">
                          {item.isDiscovery ? (
                            <span className="font-bold text-leaf">+10 new</span>
                          ) : (
                            <span className="text-dim">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-[12px] text-muted whitespace-nowrap">
                          {formatDate(item.scannedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentUsername={session?.username}
      />
    </div>
  );
}
