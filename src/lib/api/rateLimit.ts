import 'server-only';

/**
 * A fixed-window counter per key (usually the client IP), kept in memory.
 *
 * **Best effort, and honest about it.** On Vercel each serverless instance has
 * its own memory and instances come and go, so a determined client spread
 * across instances gets more than `limit` tries. It still turns "script a
 * million requests in a minute" into something slow and noisy, which is all a
 * public lookup like the certificate check needs. If a route ever needs a hard
 * guarantee, the counter has to move to shared storage (a table or Redis) —
 * the call sites would not change.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  function current(key: string, now: number) {
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) return null;
    return entry;
  }

  return {
    isLimited(key: string): boolean {
      return (current(key, Date.now())?.count ?? 0) >= limit;
    },

    hit(key: string): void {
      const now = Date.now();
      const entry = current(key, now);
      if (entry) entry.count++;
      else hits.set(key, { count: 1, resetAt: now + windowMs });

      // Keep the map from growing without bound on a long-lived instance.
      if (hits.size > 10_000) {
        for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
      }
    },
  };
}

/** The caller's IP as Vercel (or any proxy) reports it; a shared bucket otherwise. */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}
