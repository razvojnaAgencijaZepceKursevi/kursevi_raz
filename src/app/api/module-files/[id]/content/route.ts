import { NextResponse } from 'next/server';
import { notFound, unwrapMaybe, withRoute, ApiError } from '@/lib/api/errors';
import { requireUser } from '@/lib/auth/guards';
import { assertModuleAccess } from '@/lib/auth/courseAccess';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { BUCKETS } from '@/lib/storage';
import { uuidSchema } from '@/lib/schemas/common.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/module-files/:id/content — streams one module material to a viewer.
 *
 * ## Why a proxy rather than a signed URL
 *
 * `module-files` is a private bucket, so the browser cannot fetch the object
 * directly. The obvious alternative is a short-lived signed URL, but that hands
 * the client a link which works for anyone who has it until it expires — it can
 * be copied out of the network tab and pasted elsewhere.
 *
 * Streaming through this route instead means the address the page fetches is
 * same-origin and **useless without the caller's session cookie**. The storage
 * URL is never produced at all.
 *
 * That is a real improvement, and it is worth being precise about what it is
 * not: the bytes still reach the machine, because that is what rendering means.
 * Anyone determined can save the response. This raises the effort from "copy a
 * link" to "deliberately extract a file", which is the honest goal.
 *
 * `Content-Disposition: inline` matches that: the viewer renders it in place and
 * the browser is never asked to save it.
 */
export const GET = withRoute(async (_req, ctx: Ctx) => {
  const auth = await requireUser();
  const id = uuidSchema.parse((await ctx.params).id);

  const supabase = await createClient();

  const file = unwrapMaybe(
    await supabase
      .from('module_files')
      .select('module_id, file_path, file_name')
      .eq('id', id)
      .maybeSingle(),
  );

  if (!file) throw notFound();

  // Admin, the owning teacher, or an approved purchase — the same rule that
  // guards the module's other content.
  await assertModuleAccess(supabase, file.module_id, auth);

  // Service role for the download itself: access has already been decided
  // above, and this keeps the object reachable without widening the bucket.
  const svc = createServiceRoleClient();
  const { data, error } = await svc.storage.from(BUCKETS.moduleFiles).download(file.file_path);

  if (error || !data) {
    throw new ApiError(502, `Could not read the file: ${error?.message ?? 'missing object'}`);
  }

  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      'Content-Type': 'application/pdf',
      // `inline`, never `attachment` — the point is that it is read in the app.
      'Content-Disposition': `inline; filename="${encodeURIComponent(file.file_name ?? 'materijal.pdf')}"`,
      // Private: this response is scoped to one session and must never be
      // held in a shared cache.
      'Cache-Control': 'private, no-store',
    },
  });
});
