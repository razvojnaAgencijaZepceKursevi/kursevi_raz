'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Signs out, drops all cached server state, clears the auth store and returns
 * to /login. Wired into the sample protected layout; the real app-wide nav is
 * built manually later.
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clear = useAuthStore((s) => s.clear);
  const [pending, setPending] = React.useState(false);

  const logout = React.useCallback(async () => {
    setPending(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      clear();
      queryClient.clear();
      router.replace('/login');
      router.refresh();
    } finally {
      setPending(false);
    }
  }, [router, queryClient, clear]);

  return { logout, pending };
}
