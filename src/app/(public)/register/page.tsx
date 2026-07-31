'use client';

import * as React from 'react';
import NextLink from 'next/link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import AuthCard from '@/components/AuthCard';
import { createClient } from '@/lib/supabase/client';
import { publicEnv } from '@/lib/env';

export default function RegisterPage() {
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Consumed by the handle_new_user() trigger to populate profiles.full_name.
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${publicEnv.siteUrl}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setPending(false);
      return;
    }

    // No redirect: the account is unusable until the email is confirmed.
    setSent(true);
    setPending(false);
  }

  if (sent) {
    return (
      <AuthCard title="Check your email">
        <Stack spacing={2}>
          <Alert severity="success">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your
            account, then sign in.
          </Alert>
          <Link component={NextLink} href="/login" variant="body2">
            Back to sign in
          </Link>
        </Stack>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create account" subtitle="Start learning in a couple of minutes.">
      <form onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            required
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            helperText="At least 8 characters."
            required
          />
          <TextField
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            error={passwordMismatch}
            helperText={passwordMismatch ? 'Passwords do not match.' : ' '}
            required
          />

          <Button type="submit" variant="contained" size="large" disabled={pending}>
            {pending ? 'Creating account…' : 'Create account'}
          </Button>

          <Link component={NextLink} href="/login" variant="body2">
            Already have an account? Sign in
          </Link>
        </Stack>
      </form>
    </AuthCard>
  );
}
