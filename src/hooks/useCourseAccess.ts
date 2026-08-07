'use client';

import { usePurchases } from './usePurchases';
import { useAuthStore } from '@/store/useAuthStore';
import { purchaseStateFrom, type PurchaseState } from '@/lib/courseAccess';

/**
 * What the current viewer is allowed to do with one course.
 *
 * The course page has four audiences — signed out, signed in without a
 * purchase, signed in with one, and admin — and nearly every element on it
 * branches on which. Resolving that once, here, keeps the page from
 * re-deriving "is this person allowed to..." at every turn.
 *
 *   const access = useCourseAccess(courseId);
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
  purchaseState: PurchaseState;
  /** May open module content. Admins qualify without buying anything. */
  canOpenModules: boolean;
  /** Admins ignore the completed-so-far sequence and may open any module. */
  bypassSequence: boolean;
  /** Hide the price once it can no longer be acted on. */
  showPrice: boolean;
};

export function useCourseAccess(courseId: string | undefined): CourseAccess {
  const profile = useAuthStore((s) => s.profile);
  const authLoading = useAuthStore((s) => s.loading);

  const isAuthenticated = profile !== null;
  const isAdmin = profile?.role === 'admin';

  // Signed-out visitors would get a 401 here, so the query stays idle for them.
  // Admins don't buy courses, so there's nothing to look up for them either.
  const shouldCheckPurchase = Boolean(courseId) && isAuthenticated && !isAdmin;

  const purchases = usePurchases({ courseId, pageSize: 5 }, { enabled: shouldCheckPurchase });

  const purchaseState = shouldCheckPurchase ? purchaseStateFrom(purchases.data?.data) : 'none';

  const isResolved = !authLoading && (!shouldCheckPurchase || !purchases.isPending);

  const canOpenModules = isAdmin || purchaseState === 'approved';

  return {
    isResolved,
    isAuthenticated,
    isAdmin,
    purchaseState,
    canOpenModules,
    bypassSequence: isAdmin,
    // Redundant once someone owns the course; an admin never pays for one.
    showPrice: !canOpenModules,
  };
}
