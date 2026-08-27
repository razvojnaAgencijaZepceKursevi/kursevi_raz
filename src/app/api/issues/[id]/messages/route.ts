import { NextResponse } from 'next/server';
import {
  conflict,
  forbidden,
  parseBody,
  parseQuery,
  unwrapMany,
  unwrapMaybe,
  unwrapOne,
  withRoute,
} from '@/lib/api/errors';
import { requireUser } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { metaFor, paginationQuerySchema, rangeFor, uuidSchema } from '@/lib/schemas/common.schema';
import { createIssueMessageSchema, type IssueStatus } from '@/lib/schemas/issues.schema';
import { adminIds, notifyAfterResponse } from '@/lib/services/notifications';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/issues/:id/messages — the thread, oldest first. */
export const GET = withRoute(async (req, ctx: Ctx) => {
  await requireUser();
  const issueId = uuidSchema.parse((await ctx.params).id);
  const query = parseQuery(req, paginationQuerySchema);

  const supabase = await createClient();
  const [from, to] = rangeFor(query);

  // RLS restricts this to the reporter and admins.
  const result = await supabase
    .from('issue_messages')
    .select('*, profiles!issue_messages_sender_id_fkey(id, full_name, email)', { count: 'exact' })
    .eq('issue_id', issueId)
    .order('created_at', { ascending: true })
    .range(from, to);

  return NextResponse.json({
    data: unwrapMany(result),
    meta: metaFor(query, result.count ?? 0),
  });
});

/**
 * POST /api/issues/:id/messages — reply, and for an admin decide.
 *
 * ## Both sides, one endpoint
 *
 * Same arrangement as the submission thread: a `status` from an admin is
 * honoured, a `status` from the reporter is ignored rather than rejected, so
 * neither side needs its own route.
 *
 * ## Closing is not final, unlike approving a submission
 *
 * An approved submission is sealed — a decision and the transcript behind it
 * must agree, and there is no un-approving. An issue is the opposite: "closed"
 * means the admin believes it is dealt with, and the person who raised it is
 * exactly the one who might disagree. So a reply to a closed issue is allowed
 * and **re-opens it**, which is what a support channel that people trust has to
 * do. Only an admin closing it again settles it.
 *
 * The one thing refused is an admin replying to a closed issue without saying
 * what they want to happen to it — see below.
 */
export const POST = withRoute(async (req, ctx: Ctx) => {
  const { userId, profile } = await requireUser();
  const issueId = uuidSchema.parse((await ctx.params).id);
  const body = await parseBody(req, createIssueMessageSchema);

  const supabase = await createClient();
  const isAdmin = profile.role === 'admin';

  const issue = unwrapMaybe(
    await supabase
      .from('issues')
      .select('id, reporter_id, subject, status')
      .eq('id', issueId)
      .maybeSingle(),
  );
  if (!issue) throw forbidden('You are not a participant in this issue');

  if (isAdmin && issue.status === 'closed' && !body.status) {
    throw conflict('This issue is closed; reopen it by setting a status alongside your reply');
  }

  const message = unwrapOne(
    await supabase
      .from('issue_messages')
      .insert({ issue_id: issueId, sender_id: userId, body: body.body })
      .select('*, profiles!issue_messages_sender_id_fkey(id, full_name, email)')
      .single(),
  );

  /*
   * What the reply does to the status.
   *
   * An admin says so explicitly. For the reporter it is derived: replying means
   * the ball is back with support, so an `answered` or `closed` issue returns
   * to `open`. That is the re-opening rule, and it is deliberately automatic —
   * asking a frustrated user to also change a dropdown would be the wrong
   * moment to demand precision.
   */
  let nextStatus: IssueStatus = issue.status;
  if (isAdmin && body.status) nextStatus = body.status;
  else if (!isAdmin && issue.status !== 'open') nextStatus = 'open';

  if (nextStatus !== issue.status) {
    // `issues` grants UPDATE to admins only, so a reporter re-opening their own
    // issue has to go through the service role. The ownership check is the
    // `issue` lookup above, which RLS already scoped to them.
    const svc = createServiceRoleClient();
    const closing = nextStatus === 'closed';

    unwrapOne(
      await svc
        .from('issues')
        .update({
          status: nextStatus,
          closed_at: closing ? new Date().toISOString() : null,
          closed_by: closing ? userId : null,
        })
        .eq('id', issueId)
        .select('id')
        .single(),
    );
  }

  const excerpt = body.body.length > 160 ? `${body.body.slice(0, 157)}…` : body.body;

  if (isAdmin) {
    // To the reporter. Closing is its own fact, separate from the reply, so it
    // carries its own notification type and preference switch.
    const href = `/issues/${issueId}`;
    notifyAfterResponse({
      userIds: [issue.reporter_id].filter((id) => id !== userId),
      type: nextStatus === 'closed' ? 'issue_closed' : 'issue_reply',
      title: nextStatus === 'closed' ? 'Prijava je zatvorena' : 'Odgovor na vašu prijavu',
      body: `${issue.subject}: ${excerpt}`,
      link: href,
      email: {
        subject:
          nextStatus === 'closed'
            ? `Prijava zatvorena — ${issue.subject}`
            : `Odgovor na prijavu — ${issue.subject}`,
        heading: nextStatus === 'closed' ? 'Prijava je zatvorena' : 'Stigao je odgovor',
        lines: [
          `Administrator je odgovorio na vašu prijavu „${issue.subject}”:`,
          excerpt,
          ...(nextStatus === 'closed'
            ? ['Ako problem i dalje postoji, odgovorite na prijavu i ponovo ćemo je otvoriti.']
            : []),
        ],
        action: { label: 'Otvori prijavu', href },
      },
    });
  } else {
    const href = `/admin/issues/${issueId}`;
    notifyAfterResponse({
      userIds: await adminIds(createServiceRoleClient()),
      type: 'issue_reply',
      title: 'Novi odgovor na prijavu',
      body: `${profile.full_name} — ${issue.subject}: ${excerpt}`,
      link: href,
      email: {
        subject: `Novi odgovor na prijavu — ${issue.subject}`,
        heading: 'Novi odgovor na prijavu',
        lines: [`${profile.full_name} je odgovorio/la na prijavu „${issue.subject}”:`, excerpt],
        action: { label: 'Otvori prijavu', href },
      },
    });
  }

  return NextResponse.json({ data: message, issue_status: nextStatus }, { status: 201 });
});
