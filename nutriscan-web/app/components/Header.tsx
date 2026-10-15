'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trophy, LogOut, ChevronDown, LayoutDashboard, Settings, Zap, History } from 'lucide-react';
import { clearSession, useSession } from '@/lib/auth';
import { clearRecentSearches, useRecentSearches } from '@/lib/recent';
import LeaderboardModal from './LeaderboardModal';
import RecentSearchesModal from './RecentSearchesModal';
import Brand from './Brand';

interface HeaderProps {
  // On the home page: check a recent product in place. Elsewhere it navigates home first.
  onPickRecent?: (barcode: string) => void;
}

export default function Header({ onPickRecent }: HeaderProps = {}) {
  const router = useRouter();
  const recentCount = useRecentSearches().length;
  const [isRecentOpen, setIsRecentOpen] = useState(false);
  // Live session: XP and name update as soon as they change anywhere in the app
  const session = useSession();
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close menu when clicked outside or on Escape
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleLogout = () => {
    clearSession();
    clearRecentSearches(); // don't leave this person's lookups for the next one on this device
    setIsMenuOpen(false);
    router.push('/login');
  };

  const pickRecent = (barcode: string) => {
    if (onPickRecent) onPickRecent(barcode);
    else router.push(`/?scan=${encodeURIComponent(barcode)}`);
  };

  const scoutLevel = session ? Math.max(1, Math.floor((session.scoutScore || 0) / 50) + 1) : 1;

  return (
    <>
      <header className="w-full sticky top-0 z-40 bg-bg/95 border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="shrink-0" aria-label="NutriScan home">
            <Brand />
          </Link>

          <nav className="flex items-center gap-2">
            <button
              onClick={() => setIsRecentOpen(true)}
              className="btn-ghost btn-sm"
              aria-label={`Recent searches (${recentCount})`}
            >
              <History className="w-4 h-4 text-leaf" />
              <span className="hidden sm:inline">Recent</span>
              {recentCount > 0 && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-leaf text-bg font-mono text-[10px] font-bold flex items-center justify-center">
                  {recentCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsLeaderboardOpen(true)}
              className="btn-ghost btn-sm"
              aria-label="Open leaderboard"
            >
              <Trophy className="w-4 h-4 text-sun" />
              <span className="hidden sm:inline">Leaderboard</span>
            </button>

            {session ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 h-9 pl-1 pr-3 rounded-full bg-raised border border-line-strong hover:border-muted transition-colors cursor-pointer"
                  aria-expanded={isMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Account menu"
                >
                  <span className="w-7 h-7 rounded-full bg-leaf text-bg flex items-center justify-center font-display font-extrabold text-sm uppercase">
                    {session.username ? session.username.charAt(0) : 'U'}
                  </span>
                  <span className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold">
                    @{session.username || 'scout'}
                    <span className="flex items-center gap-0.5 font-mono text-[10px] text-leaf">
                      <Zap className="w-3 h-3 fill-leaf" />
                      {scoutLevel}
                    </span>
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2.5 w-64 panel rounded-2xl p-1.5 z-50 shadow-[0_24px_50px_-20px_rgb(31_45_36/0.45)]" role="menu">
                    <div className="px-3 py-3 rounded-xl bg-raised">
                      <p className="font-display text-base font-bold truncate">{session.fullName || 'Scout'}</p>
                      <p className="text-xs text-muted truncate">{session.email}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="eyebrow">Scout score</span>
                        <span className="font-mono text-[13px] font-bold text-leaf">{session.scoutScore || 0} XP</span>
                      </div>
                    </div>

                    <div className="py-1.5">
                      <Link
                        href="/dashboard"
                        role="menuitem"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-raised transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-muted" />
                        Dashboard
                      </Link>
                      <Link
                        href="/profile"
                        role="menuitem"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-raised transition-colors"
                      >
                        <Settings className="w-4 h-4 text-muted" />
                        Profile & diet
                      </Link>
                    </div>

                    <div className="border-t border-line pt-1.5">
                      <button
                        onClick={handleLogout}
                        role="menuitem"
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-clay hover:bg-clay/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="btn-primary btn-sm">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <RecentSearchesModal isOpen={isRecentOpen} onClose={() => setIsRecentOpen(false)} onPick={pickRecent} />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentUsername={session?.username}
      />
    </>
  );
}
