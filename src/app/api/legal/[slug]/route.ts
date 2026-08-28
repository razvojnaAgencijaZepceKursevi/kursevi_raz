import { NextResponse } from 'next/server';
import { parseBody, unwrapOne, withRoute } from '@/lib/api/errors';
import { requireAdmin } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { legalSlugSchema, updateLegalDocumentSchema } from '@/lib/schemas/legal.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ slug: string }> };

const COLUMNS = 'slug, title, content, updated_at';

/**
 * One legal document — `terms` or `privacy` (migration 0030).
 *
 * The slug is validated against the same two values as the table's check
 * constraint, so an unknown one is a 400 here rather than an empty 404 from the
 * database. Both rows are seeded by the migration, so a valid slug always
 * resolves; `content` may be empty, which the page renders as "not written yet"
 * rather than as a blank document.
 */
export const GET = withRoute(async (_req, ctx: Ctx) => {
  const slug = legalSlugSchema.parse((await ctx.params).slug);

  // Public by policy (`legal_documents_select_all`) — these are the documents
  // a visitor must be able to read *before* agreeing to anything, so they
  // cannot sit behind a session.
  const supabase = await createClient();

  const data = unwrapOne(
    await supabase.from('legal_documents').select(COLUMNS).eq('slug', slug).single(),
  );

  return NextResponse.json({ data });
});

/** PATCH — admin only. Legal text is platform-wide, never course-scoped. */
export const PATCH = withRoute(async (req, ctx: Ctx) => {
  const { userId } = await requireAdmin();
  const slug = legalSlugSchema.parse((await ctx.params).slug);
  const body = await parseBody(req, updateLegalDocumentSchema);

  const supabase = await createClient();

  const data = unwrapOne(
    await supabase
      .from('legal_documents')
      .update({ ...body, updated_by: userId })
      .eq('slug', slug)
      .select(COLUMNS)
      .single(),
  );

  return NextResponse.json({ data });
});
