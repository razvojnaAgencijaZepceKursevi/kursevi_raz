'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore, type AuthProfile } from '@/store/useAuthStore';

async function fetchProfile(): Promise<AuthProfile | null> {
  const res = await fetch('/api/me', { cache: 'no-store' });
  if (!res.ok) return null;
  const body = (await res.json()) as { profile: AuthProfile };
  return body.profile ?? null;
}

/**
 * Mounted once in the root layout. Subscribes to Supabase auth events and
 * mirrors the resulting profile into `useAuthStore`, which keeps role-based UI
 * in sync across tabs and page refreshes without every component hitting
 * `/api/me` itself.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setProfile = useAuthStore((s) => s.setProfile);
  const clear = useAuthStore((s) => s.clear);

  React.useEffect(() => {
    const supabase = createClient();
    let active = true;

    // `onAuthStateChange` fires an INITIAL_SESSION event on subscribe, which
    // covers the initial load — no separate bootstrap fetch needed.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (!session) {
        clear();
        return;
      }

      if (event === 'TOKEN_REFRESHED') return; // same user, profile unchanged

      void fetchProfile().then((profile) => {
        if (active) setProfile(profile);
      });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [setProfile, clear]);

  return <>{children}</>;
}
