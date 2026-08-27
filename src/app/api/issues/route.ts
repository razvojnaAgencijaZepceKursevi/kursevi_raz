import { NextResponse } from 'next/server';
import { parseBody, parseQuery, unwrapMany, unwrapOne, withRoute } from '@/lib/api/errors';
import { requireUser } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { metaFor, rangeFor } from '@/lib/schemas/common.schema';
import { createIssueSchema, listIssuesQuerySchema } from '@/lib/schemas/issues.schema';
import { adminIds, notifyAfterResponse } from '@/lib/services/notifications';

export const dynamic = 'force-dynamic';

const ISSUE_SELECT =
  '*, profiles!issues_reporter_id_fkey(id, full_name, email), issue_messages(count)';

/** PostgREST returns a count embed as `[{ count: n }]`; nobody downstream should know. */
function flattenIssue<T extends { issue_messages?: { count: number }[] | null }>(issue: T) {
  const { issue_messages, ...rest } = issue;
  return { ...rest, message_count: issue_messages?.[0]?.count ?? 0 };
}

/**
 * GET /api/issues — the caller's own issues, or every issue for an admin.
 *
 * One endpoint for both, scoped by RLS rather than by a branch here:
 * `issues_select_own_or_admin` returns your own rows if you are a user and all
 * of them if you are an admin. A teacher is a user like any other — issues are
 * deliberately not visible to them, since one may be *about* them.
 */
export const GET = withRoute(async (req) => {
  await requireUser();
  const query = parseQuery(req, listIssuesQuerySchema);

  const supabase = await createClient();
  const [from, to] = rangeFor(query);

  let q = supabase.from('issues').select(ISSUE_SELECT, { count: 'exact' });

  if (query.status) q = q.eq('status', query.status);
  // Ignored for a non-admin — RLS has already narrowed the rows to their own,
  // so the filter can only ever be a no-op or an empty result for them.
  if (query.reporterId) q = q.eq('reporter_id', query.reporterId);
  if (query.search) q = q.ilike('subject', `%${query.search}%`);

  const result = await q.order('created_at', { ascending: false }).range(from, to);

  return NextResponse.json({
    data: unwrapMany(result).map(flattenIssue),
    meta: metaFor(query, result.count ?? 0),
  });
});

/**
 * POST /api/issues — open one, with its first message.
 *
 * Both inserts run on the caller's own client: they have INSERT policies for
 * their own rows, so no escalation is warranted. The subject and the opening
 * message are written together because an issue with no message says nothing.
 */
export const POST = withRoute(async (req) => {
  const { userId, profile } = await requireUser();
  const body = await parseBody(req, createIssueSchema);

  const supabase = await createClient();

  const issue = unwrapOne(
    await supabase
      .from('issues')
      .insert({ reporter_id: userId, subject: body.subject })
      .select()
      .single(),
  );

  const message = unwrapOne(
    await supabase
      .from('issue_messages')
      .insert({ issue_id: issue.id, sender_id: userId, body: body.body })
      .select()
      .single(),
  );

  const href = `/admin/issues/${issue.id}`;
  const excerpt = body.body.length > 160 ? `${body.body.slice(0, 157)}…` : body.body;

  notifyAfterResponse({
    userIds: await adminIds(createServiceRoleClient()),
    type: 'issue_opened',
    title: 'Nova prijava',
    body: `${profile.full_name}: ${body.subject}`,
    link: href,
    email: {
      subject: `Nova prijava — ${body.subject}`,
      heading: 'Nova prijava korisnika',
      lines: [`${profile.full_name} (${profile.email}) je poslao/la prijavu:`, excerpt],
      action: { label: 'Otvori prijavu', href },
    },
  });

  return NextResponse.json({ data: { ...issue, message } }, { status: 201 });
});
