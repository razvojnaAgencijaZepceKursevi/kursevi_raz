import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/errors';
import { requireUser } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

/** GET /api/me — current profile + role. */
export const GET = withRoute(async () => {
  const { profile } = await requireUser();
  return NextResponse.json({ profile });
});
