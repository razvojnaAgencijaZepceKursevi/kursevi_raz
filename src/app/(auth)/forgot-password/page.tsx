'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import AuthCard from '@/components/AuthCard';
import { createClient } from '@/lib/supabase/client';
import { publicEnv } from '@/lib/env';

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);

    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      // Routed through the callback so the recovery code is exchanged for a
      // session before the reset form loads.
      redirectTo: `${publicEnv.siteUrl}/auth/callback?next=/reset-password`,
    });

    // Deliberately ignores the result: reporting whether the address exists
    // would turn this form into an account-enumeration oracle.
    setSent(true);
    setPending(false);
  }

  if (sent) {
    return (
      <AuthCard title="Check your email">
        <Stack spacing={2}>
          <Alert severity="info">
            If an account exists for <strong>{email}</strong>, we have sent a password reset link.
          </Alert>
          <Link href="/login" variant="body2">
            Back to sign in
          </Link>
        </Stack>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset password" subtitle="We'll email you a link to set a new password.">
      <form onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Button type="submit" variant="contained" size="large" disabled={pending}>
            {pending ? 'Sending…' : 'Send reset link'}
          </Button>
          <Link href="/login" variant="body2">
            Back to sign in
          </Link>
        </Stack>
      </form>
    </AuthCard>
  );
}
