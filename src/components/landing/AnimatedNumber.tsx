// components/landing/AnimatedNumber.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Counts up from 0 to `target` once this element scrolls into view,
 * then stays put — doesn't re-trigger on repeated scroll in/out.
 *
 * Used by StatsBar for the "42 / 6.800 / 48h / 91%" numbers. Kept as its
 * own file since other sections may want the same effect later.
 *
 * A Client Component — needs IntersectionObserver and animation state,
 * neither of which exist on the server.
 */
export default function AnimatedNumber({
  target,
  suffix = '',
  thousands = false,
  duration = 1500,
}: {
  target: number;
  suffix?: string;
  /** Formats the count with '.' as a thousands separator, e.g. 6.800. */
  thousands?: boolean;
  duration?: number;
}) {
  const [value, setValue] = useState(0);
  const spanRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimated.current) return;
        hasAnimated.current = true;

        const start = performance.now();

        function tick(now: number) {
          const progress = Math.min((now - start) / duration, 1);
          // Ease-out cubic: fast start, slow finish — reads better than
          // a linear count for this kind of "counting up" effect.
          const eased = 1 - (1 - progress) ** 3;
          setValue(Math.round(target * eased));
          if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  const formatted = thousands ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : value;

  return (
    <span ref={spanRef}>
      {formatted}
      {suffix}
    </span>
  );
}
