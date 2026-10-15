import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import Brand from './Brand';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-xs">
            <Link href="/" aria-label="NutriScan home">
              <Brand size={30} />
            </Link>
            <p className="text-sm text-muted mt-3 leading-relaxed">
              Scan any packaged food and see what&apos;s really inside. Data from Open Food Facts.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium" aria-label="Footer">
            <Link href="/" className="text-muted hover:text-leaf transition-colors">Scan</Link>
            <Link href="/dashboard" className="text-muted hover:text-leaf transition-colors">Dashboard</Link>
            <Link href="/profile" className="text-muted hover:text-leaf transition-colors">Profile</Link>
            <Link href="/register" className="text-muted hover:text-leaf transition-colors">Join</Link>
          </nav>
        </div>

        <div className="h-px bg-line my-7" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="inline-flex items-center gap-1.5 text-sm text-muted">
            Made with
            <Heart className="w-3.5 h-3.5 text-clay fill-clay" aria-label="love" />
            by
            <span className="font-display font-semibold text-leaf">Silent Coder</span>
          </p>
          <p className="font-mono text-[11px] uppercase tracking-wider text-dim text-center sm:text-right">
            © NutriScan · Values per 100 g · Not medical advice
          </p>
        </div>
      </div>
    </footer>
  );
}
