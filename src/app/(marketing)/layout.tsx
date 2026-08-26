import Box from '@mui/material/Box';
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
 * Add a footer here when the legal and contact pages exist — this is the one
 * place it needs to go.
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
    </Box>
  );
}
