'use client';

import { usePurchases } from './usePurchases';
import { useAuthStore } from '@/store/useAuthStore';
import { purchaseStateFrom, type PurchaseState } from '@/lib/courseAccess';
import type { Purchase } from '@/lib/schemas/purchases.schema';

/**
 * What the current viewer is allowed to do with one course.
 *
 * The course page has four audiences — signed out, signed in without a
 * purchase, signed in with one, and staff (an admin, or the teacher who owns
 * the course) — and nearly every element on it branches on which. Resolving that once, here, keeps the page from
 * re-deriving "is this person allowed to..." at every turn.
 *
 *   const access = useCourseAccess(courseId, course.owner_id);
 *   if (access.canOpenModules) …
 *
 * Note `isResolved`. Auth state arrives asynchronously, so on first paint every
 * viewer looks signed out. Rendering the locked view during that moment would
 * make a paying student's page visibly flip from "buy this" to their modules.
 * Wait for `isResolved` before committing to either.
 */
export type CourseAccess = {
  /** False until both the session and any purchase lookup have settled. */
  isResolved: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  /** The signed-in teacher owns this course. */
  isOwner: boolean;
  /**
   * An admin or the owning teacher — someone previewing the course rather than
   * studying it. Mirrors `assertCourseAccess` on the server.
   */
  isStaff: boolean;
  purchaseState: PurchaseState;
  /** May open module content. Staff qualify without buying anything. */
  canOpenModules: boolean;
  /** Staff ignore the completed-so-far sequence and may open any module. */
  bypassSequence: boolean;
  /** Hide the price once it can no longer be acted on. */
  showPrice: boolean;
  /**
   * The still-pending request, when there is one.
   *
   * Carried through so the course page can show its payment reference — the
   * student needs that number to make the transfer, and the moment right after
   * requesting is exactly when they need it.
   */
  pendingPurchase: Purchase | undefined;
};

export function useCourseAccess(
  courseId: string | undefined,
  /**
   * `courses.owner_id`. Needed because a teacher's access to a course is a fact
   * about the course, not about the teacher — the role alone does not say
   * whether this one is theirs.
   */
  ownerId: string | null | undefined,
): CourseAccess {
  const profile = useAuthStore((s) => s.profile);
  const authLoading = useAuthStore((s) => s.loading);

  const isAuthenticated = profile !== null;
  const isAdmin = profile?.role === 'admin';
  // The role check matters: `owner_id` survives a demotion, and a former
  // teacher is not staff any more (the database agrees — see `owns_course()`).
  const isOwner = profile?.role === 'teacher' && Boolean(ownerId) && ownerId === profile.id;
  const isStaff = isAdmin || isOwner;

  // Signed-out visitors would get a 401 here, so the query stays idle for them.
  // Staff don't buy courses, so there's nothing to look up for them either.
  const shouldCheckPurchase = Boolean(courseId) && isAuthenticated && !isStaff;

  const purchases = usePurchases({ courseId, pageSize: 5 }, { enabled: shouldCheckPurchase });

  const purchaseState = shouldCheckPurchase ? purchaseStateFrom(purchases.data?.data) : 'none';

  const isResolved = !authLoading && (!shouldCheckPurchase || !purchases.isPending);

  const canOpenModules = isStaff || purchaseState === 'approved';

  const pendingPurchase = purchases.data?.data.find((p) => p.status === 'requested');

  return {
    isResolved,
    isAuthenticated,
    isAdmin,
    isOwner,
    isStaff,
    purchaseState,
    canOpenModules,
    pendingPurchase,
    bypassSequence: isStaff,
    // Redundant once someone has access; staff never pay for a course.
    showPrice: !canOpenModules,
  };
}
