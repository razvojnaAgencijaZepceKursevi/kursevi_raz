import Box from '@mui/material/Box';
import PublicFooter from '@/components/layout/PublicFooter';
import PublicHeader from '@/components/layout/PublicHeader';

/**
 * Chrome for every public-facing page: landing, course catalogue, individual
 * courses, blog, and the legal pages.
 *
 * ## Why `(marketing)` and `(auth)` are separate groups
 *
 * These pages and the auth pages are both public, and they used to share one
 * `(public)` group. But they need opposite chrome — marketing pages want a nav
 * bar, while login renders as a bare centred card — so the header could not
 * live at the group level and was scoped to `courses/` instead. Every new
 * public section would have had to repeat it.
 *
 * Splitting the group lets each side state its own chrome once. Route groups
 * contribute nothing to the URL, so `/login` and `/courses/…` are unchanged by
 * the move.
 *
 * The footer lives here for the same reason as the header: one place, every
 * public page, nothing to repeat. It is what makes the legal and contact pages
 * reachable at all — nobody navigates *to* a privacy policy.
 *
 * No auth check: these pages are public by design. What a signed-in visitor
 * sees differs per page (see `useCourseAccess`), not per layout.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <PublicHeader />
      <Box component="main" sx={{ p: { xs: 2, sm: 3, lg: 4 } }}>
        {children}
      </Box>
      <PublicFooter />
    </Box>
  );
}
