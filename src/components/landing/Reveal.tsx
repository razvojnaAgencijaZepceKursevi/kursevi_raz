'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Fades its children in — and lifts them a few pixels — the first time they
 * scroll into view, then leaves them alone.
 *
 * Same shape as `<AnimatedNumber>`, deliberately: an `IntersectionObserver`
 * that disconnects itself on the first hit, so nothing re-plays as the visitor
 * scrolls back up. Scroll animation that repeats stops being a cue and starts
 * being a distraction.
 *
 * ## What it does not hide
 *
 * The children are rendered by the server exactly as they would be otherwise;
 * only `opacity` and `transform` differ before the reveal. The text is in the
 * page source, so a crawler or a reader-mode extractor sees the whole landing
 * page whether or not this ever runs.
 *
 * Two safety nets on top of that:
 *   - **`prefers-reduced-motion`** skips the animation entirely, in CSS, so a
 *     visitor who has asked for stillness never sees a transition — not even a
 *     fast one.
 *   - a **timeout** reveals the content anyway after a second, so a browser
 *     without `IntersectionObserver`, or an element that somehow never
 *     intersects, cannot leave the section invisible.
 *
 * `delay` staggers siblings — a grid of cards arriving together reads as a
 * flash, arriving 60ms apart reads as a list being dealt out. Keep it small;
 * anything past ~250ms feels like the page is loading slowly.
 */
export default function Reveal({
  children,
  delay = 0,
  distance = 14,
  sx,
}: {
  children: React.ReactNode;
  /** Milliseconds to hold before this element starts its transition. */
  delay?: number;
  /** How far below its resting place the element starts, in pixels. */
  distance?: number;
  sx?: SxProps<Theme>;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }

    const fallback = window.setTimeout(() => setShown(true), 1000);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      // A low threshold: these are whole sections, and waiting for 40% of a
      // tall one to be on screen would mean its heading animates in only after
      // the visitor is already reading it.
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    );

    observer.observe(el);
    return () => {
      window.clearTimeout(fallback);
      observer.disconnect();
    };
  }, []);

  return (
    <Box
      ref={ref}
      sx={[
        {
          opacity: shown ? 1 : 0,
          transform: shown ? 'none' : `translate3d(0, ${distance}px, 0)`,
          transition: `opacity 520ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 520ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
          '@media (prefers-reduced-motion: reduce)': {
            opacity: 1,
            transform: 'none',
            transition: 'none',
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}
