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
 * Color scheme: the theme defines both `light` and `dark`, but the app is
 * pinned to light for now. `defaultMode` overrides MUI's `'system'` default
 * (which was picking up the OS dark preference), and `storageManager={null}`
 * disables the localStorage-backed mode so nothing can flip it.
 *
 * When a theme toggle lands: drop `storageManager={null}` to re-enable
 * persistence, add `<InitColorSchemeScript defaultMode="light" attribute="class" />`
 * as the first child of `<body>` to avoid a flash of the wrong scheme on SSR,
 * and drive the switch with `useColorScheme()`.
 */
export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: 'mui', enableCssLayer: true }}>
      <ThemeProvider theme={theme} defaultMode="light" storageManager={null}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
