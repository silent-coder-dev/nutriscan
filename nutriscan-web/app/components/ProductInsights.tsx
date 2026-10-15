'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, Check, CircleAlert, Info, ShieldAlert, UserRound, X } from 'lucide-react';
import { InsightPoint, ProductInsights as Insights } from '@/lib/api';

interface ProductInsightsProps {
  insights: Insights | null;
  loading: boolean;
  error: string | null;
  signedIn: boolean;
}

const TONE: Record<InsightPoint['tone'], { icon: React.ComponentType<{ className?: string }>; dot: string; text: string }> = {
  good: { icon: Check, dot: 'bg-river text-bg', text: 'text-river' },
  warn: { icon: CircleAlert, dot: 'bg-sun text-bg', text: 'text-sun' },
  bad: { icon: X, dot: 'bg-clay text-bg', text: 'text-clay' },
  info: { icon: Info, dot: 'bg-raised text-muted', text: 'text-muted' },
};

function Finding({ point }: { point: InsightPoint }) {
  const tone = TONE[point.tone] ?? TONE.info;
  const Icon = tone.icon;
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${tone.dot}`}>
        <Icon className="w-3.5 h-3.5 stroke-[3]" />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold leading-snug">{point.title}</span>
        <span className="block text-[13px] text-muted leading-snug">{point.detail}</span>
      </span>
    </li>
  );
}

export default function ProductInsights({ insights, loading, error, signedIn }: ProductInsightsProps) {
  if (loading) {
    return (
      <section className="panel p-6 sm:p-7" aria-busy="true" aria-label="Loading analysis">
        <p className="eyebrow">NutriBot&apos;s take</p>
        <div className="mt-4 space-y-2.5">
          <div className="h-5 w-11/12 rounded-md bg-raised animate-pulse" />
          <div className="h-5 w-4/5 rounded-md bg-raised animate-pulse" />
          <div className="h-5 w-2/3 rounded-md bg-raised animate-pulse" />
        </div>
        <p className="text-[13px] text-dim mt-4">Reading the label…</p>
      </section>
    );
  }

  if (error || !insights) {
    return (
      <div className="notice-error" role="alert">
        <AlertCircle className="w-4 h-4 shrink-0 text-clay mt-0.5" />
        <span>{error || 'The analysis is not available right now.'}</span>
      </div>
    );
  }

  const good = insights.highlights.filter((p) => p.tone === 'good');
  const watch = insights.highlights.filter((p) => p.tone !== 'good');

  return (
    <section className="panel p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="eyebrow">NutriBot&apos;s take</p>
        <span className="tag text-muted" title={insights.summarySource === 'AI' ? 'Written by an AI model from the label data' : 'Built from the nutrition values on the label'}>
          {insights.summarySource === 'AI' ? 'AI summary' : 'Label analysis'}
        </span>
      </div>

      <p className="font-display text-[22px] sm:text-[24px] leading-snug mt-3 text-fg">{insights.summary}</p>

      {(good.length > 0 || watch.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-x-8 mt-6 pt-5 border-t border-line">
          {watch.length > 0 && (
            <div>
              <h4 className="eyebrow">Watch out</h4>
              <ul className="mt-1 divide-y divide-line">
                {watch.map((point) => <Finding key={point.title} point={point} />)}
              </ul>
            </div>
          )}
          {good.length > 0 && (
            <div>
              <h4 className="eyebrow mt-4 sm:mt-0">The good stuff</h4>
              <ul className="mt-1 divide-y divide-line">
                {good.map((point) => <Finding key={point.title} point={point} />)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Personal alerts */}
      <div className="mt-6 pt-5 border-t border-line">
        {insights.personalized ? (
          insights.personalAlerts.length > 0 ? (
            <div className="rounded-2xl border border-clay/40 bg-clay/8 p-4">
              <p className="flex items-center gap-2 font-semibold text-clay">
                <ShieldAlert className="w-4 h-4" />
                For you
              </p>
              <ul className="mt-1 divide-y divide-clay/20">
                {insights.personalAlerts.map((point) => <Finding key={point.title} point={point} />)}
              </ul>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted">
              <UserRound className="w-4 h-4 text-river" />
              Nothing on the label clashes with your allergies or diet settings.
            </p>
          )
        ) : (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <UserRound className="w-4 h-4" />
            Want allergy and diet alerts?
            <Link href={signedIn ? '/profile' : '/register'} className="link text-sm">
              {signedIn ? 'Add them to your profile' : 'Create a free account'}
            </Link>
          </p>
        )}
        <p className="text-[12px] text-dim mt-3">Based on the label data. Always check the pack, especially for allergies.</p>
      </div>
    </section>
  );
}
