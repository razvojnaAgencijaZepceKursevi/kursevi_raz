'use client';

import * as React from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

/**
 * Emotion cache registry + theme, per the App Router MUI integration pattern.
 * `AppRouterCacheProvider` is MUI's maintained registry — it flushes emotion's
 * style tags correctly during streaming SSR, which a hand-rolled registry
 * tends to get subtly wrong.
 *
 * ## Colour scheme
 *
 * The theme has always defined both `light` and `dark`; the app was pinned to
 * light with `defaultMode="light" storageManager={null}`. Both are gone now:
 *
 *   - `defaultMode="system"` follows the operating system until the user says
 *     otherwise, which is the honest default — the browser already knows what
 *     they prefer.
 *   - dropping `storageManager={null}` re-enables MUI's localStorage-backed
 *     mode, so a choice survives a reload *on that device* with no round trip.
 *
 * The saved-to-the-database preference sits on top of that, in `<ThemeSync>`:
 * localStorage makes the choice instant, the database makes it follow the user
 * to another machine. See `InitColorSchemeScript` in the root layout for why
 * there is no flash of the wrong scheme on first paint.
 */
export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: 'mui', enableCssLayer: true }}>
      <ThemeProvider theme={theme} defaultMode="system">
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
