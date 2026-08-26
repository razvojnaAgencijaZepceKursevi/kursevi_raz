'use client';

import * as React from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/**
 * The card an auth page renders inside — title, optional subtitle, and the form.
 *
 * Centring it on an empty background is the job of `(auth)/layout.tsx`, not this
 * component, so anything else added to that group gets the same treatment
 * without wrapping itself in a copy of the shell.
 */
export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{ p: 4, width: '100%', maxWidth: 420, border: 1, borderColor: 'divider' }}
    >
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h2" component="h1">
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </Stack>
      {children}
    </Paper>
  );
}
