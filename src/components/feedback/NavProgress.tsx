'use client';

import * as React from 'react';
import { useLinkStatus } from 'next/link';
import Box from '@mui/material/Box';
import { create } from 'zustand';

/**
 * Feedback for the gap between clicking a link and the destination appearing.
 *
 * ## Why `loading.tsx` alone is not enough
 *
 * A route-segment fallback renders once the navigation has *started resolving*.
 * The click itself — and any time spent fetching the segment before React can
 * swap in the fallback — has no feedback at all, which is the "nothing happens
 * when I click" the app had. On a prefetched static route that gap is
 * imperceptible; on a dynamic one behind a slow connection it is seconds.
 *
 * So there are two layers: this covers the click, `loading.tsx` covers the
 * render.
 *
 * ## Why a store rather than one global hook
 *
 * `useLinkStatus` only works **inside a `<Link>` descendant** — there is no
 * app-wide "is a navigation pending" hook. So each nav item renders a
 * `<NavPending>` marker inside its link, which reports into this tiny store,
 * and `<NavProgressBar>` at the top of the shell renders the bar.
 *
 * The honest limit of that arrangement: only links carrying the marker feed the
 * bar. Links elsewhere — a course card, a table row — get the `loading.tsx`
 * fallback instead, which is the layer that covers everything.
 */
type NavProgressState = {
  pendingCount: number;
  start: () => void;
  stop: () => void;
};

const useNavProgressStore = create<NavProgressState>((set) => ({
  pendingCount: 0,
  /*
   * A count, not a boolean. Clicking a second link while the first is still
   * pending would otherwise let the first one's cleanup switch the bar off
   * while a navigation is still in flight.
   */
  start: () => set((state) => ({ pendingCount: state.pendingCount + 1 })),
  stop: () => set((state) => ({ pendingCount: Math.max(0, state.pendingCount - 1) })),
}));

/**
 * Drop inside a `<Link>` (or a MUI component that renders one) to report its
 * pending state upward. Renders nothing.
 */
export function NavPending() {
  const { pending } = useLinkStatus();
  const start = useNavProgressStore((s) => s.start);
  const stop = useNavProgressStore((s) => s.stop);

  React.useEffect(() => {
    if (!pending) return;
    start();
    // The cleanup runs both when the navigation resolves and if the link
    // unmounts mid-flight, so the count cannot be left stranded above zero.
    return stop;
  }, [pending, start, stop]);

  return null;
}

/**
 * The bar itself — fixed to the top of the viewport, above everything.
 *
 * An indeterminate bar rather than a percentage: nothing here knows how far
 * along a navigation is, and a fake percentage that stalls at 90% is worse than
 * an honest animation. It is `position: fixed` and 3px tall so it cannot shift
 * any layout, which is the trap the Next docs warn about with inline
 * indicators.
 */
export function NavProgressBar() {
  const pending = useNavProgressStore((s) => s.pendingCount > 0);

  return (
    <Box
      aria-hidden
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: (theme) => theme.zIndex.tooltip + 1,
        pointerEvents: 'none',
        // Kept mounted and faded, rather than mounted on demand: a bar that
        // appears and disappears flickers on fast navigations, where the whole
        // pending phase can be under 100ms.
        opacity: pending ? 1 : 0,
        transition: 'opacity 150ms ease',
        overflow: 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent, var(--mui-palette-primary-main))',
          transformOrigin: 'left',
          animation: pending ? 'nav-progress 1.1s ease-in-out infinite' : 'none',
        },
        '@keyframes nav-progress': {
          '0%': { transform: 'translateX(-100%) scaleX(0.4)' },
          '50%': { transform: 'translateX(0%) scaleX(0.7)' },
          '100%': { transform: 'translateX(100%) scaleX(0.4)' },
        },
      }}
    />
  );
}
