import React from 'react';
import Link from 'next/link';
import { X, Heart, Check } from 'lucide-react';
import Brand from './Brand';
import NutriBot from './NutriBot';

interface AuthShellProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

const PERKS = [
  'Unlimited scans, with your history saved',
  'Alerts for your allergies and diet',
  'Earn XP for first-ever discoveries',
];

export default function AuthShell({ eyebrow, title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="min-h-screen grid lg:grid-cols-[1fr_minmax(0,560px)]">
      {/* Side panel */}
      <aside className="hidden lg:flex flex-col justify-between p-12 bg-sage border-r border-line">
        <Link href="/" className="w-fit" aria-label="NutriScan home">
          <Brand />
        </Link>

        <div className="flex flex-col items-center text-center">
          <NutriBot size={230} />
          <p className="display text-[40px] leading-[1.02] mt-6 max-w-sm">
            Every scan makes you a <span className="italic text-leaf">smarter</span> shopper.
          </p>
          <ul className="mt-6 space-y-2 text-left">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-2.5 text-[15px] text-muted">
                <span className="w-5 h-5 rounded-full bg-leaf text-bg flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-dim">
          Values per 100 g · Not medical advice
        </p>
      </aside>

      {/* Form side */}
      <section className="flex flex-col px-5 sm:px-10 py-6 sm:py-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="lg:invisible" aria-label="NutriScan home">
            <Brand size={30} />
          </Link>
          <Link
            href="/"
            className="w-10 h-10 rounded-full border border-line-strong bg-surface flex items-center justify-center hover:bg-fg hover:text-bg hover:border-fg transition-colors"
            aria-label="Back to home"
          >
            <X className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-md mx-auto py-10">
            <p className="eyebrow text-leaf">{eyebrow}</p>
            <h1 className="display text-[42px] sm:text-[50px] leading-[1] mt-3">{title}</h1>
            <p className="text-muted mt-4">{subtitle}</p>

            <div className="mt-9">{children}</div>

            <div className="h-px bg-line mt-9 mb-5" />
            <p className="text-sm text-muted">{footer}</p>
          </div>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-[13px] text-dim">
          Made with
          <Heart className="w-3.5 h-3.5 text-clay fill-clay" aria-label="love" />
          by <span className="font-display font-semibold text-leaf">Silent Coder</span>
        </p>
      </section>
    </main>
  );
}
