'use client';

import * as React from 'react';
import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import AuthCard from '@/components/AuthCard';
import { createClient } from '@/lib/supabase/client';
import { landingPathForRole, useAuthStore, type AuthProfile } from '@/store/useAuthStore';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setProfile = useAuthStore((s) => s.setProfile);

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      // Supabase returns a generic "Invalid login credentials" for both a wrong
      // password and an unknown email, which is the behaviour we want — don't
      // rewrite it into something that reveals which.
      setError(
        signInError.message === 'Email nije potvrđen'
          ? 'Molimo potvrdite svoju email adresu prije prijavljivanja. Link za potvrdu se nalazi u vašem inbox-u.'
          : signInError.message,
      );
      setPending(false);
      return;
    }

    // Read the role to pick a landing page, and seed the store so the next page
    // does not flash an unauthenticated state.
    const res = await fetch('/api/me', { cache: 'no-store' });
    const profile: AuthProfile | null = res.ok ? ((await res.json()).profile ?? null) : null;
    if (profile) setProfile(profile);

    const redirectTo = searchParams.get('redirectTo');
    router.replace(
      redirectTo && redirectTo.startsWith('/') ? redirectTo : landingPathForRole(profile?.role),
    );
    router.refresh();
  }

  return (
    <AuthCard title="Prijava" subtitle="Dobrodošli nazad.">
      <form onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <TextField
            label="Lozinka"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <Button type="submit" variant="contained" size="large" disabled={pending}>
            {pending ? 'Prijavljivanje…' : 'Prijavi se'}
          </Button>

          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Link component={NextLink} href="/register" variant="body2">
              Kreiraj nalog
            </Link>
            <Link component={NextLink} href="/forgot-password" variant="body2">
              Zaboravljena lozinka?
            </Link>
          </Stack>
        </Stack>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  // useSearchParams needs a Suspense boundary to avoid opting the whole route
  // into client-side rendering.
  return (
    <React.Suspense fallback={null}>
      <LoginForm />
    </React.Suspense>
  );
}
