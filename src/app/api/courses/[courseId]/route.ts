import { NextResponse } from 'next/server';
import { unwrapOne, withRoute } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ courseId: string }> };

/** Matches the canonical uuid form PostgREST would accept for an `id` filter. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/courses/:courseId — public course detail (published only).
 *
 * Accepts **either** a uuid or a slug. The public page addresses courses by
 * slug (`/courses/uvod-u-web-programiranje`), but uuids are still handed
 * around internally — the admin screens link to the public page by id, and any
 * link shared before 0021 used one. Resolving both here means those keep
 * working instead of 404ing.
 *
 * Which column to filter on is decided by the *shape* of the value, not by
 * trying one and falling back: a slug can never look like a uuid, so there is
 * no ambiguity, and it stays a single query either way.
 */
export const GET = withRoute(async (_req, ctx: Ctx) => {
  const identifier = (await ctx.params).courseId;

  const supabase = await createClient();

  const course = unwrapOne(
    await supabase
      .from('courses')
      .select('*')
      .eq(UUID_RE.test(identifier) ? 'id' : 'slug', identifier)
      .eq('published', true)
      .maybeSingle(),
  );

  return NextResponse.json({ data: course });
});
