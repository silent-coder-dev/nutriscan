'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSession, subscribeToAuth } from '@/lib/auth';
import { BrandMark } from './Brand';

type AuthState = 'checking' | 'signed-in' | 'signed-out';

const readAuthState = (): AuthState => (getSession() ? 'signed-in' : 'signed-out');
const readServerAuthState = (): AuthState => 'checking';

// Renders children only for signed-in users; everyone else is sent to /login.
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const authState = useSyncExternalStore(subscribeToAuth, readAuthState, readServerAuthState);

  useEffect(() => {
    if (authState === 'signed-out') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [authState, pathname, router]);

  if (authState !== 'signed-in') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" role="status">
        <span className="animate-pulse">
          <BrandMark size={44} />
        </span>
        <p className="eyebrow">
          {authState === 'signed-out' ? 'Taking you to sign in…' : 'Checking your session…'}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
