import Box from '@mui/material/Box';
import PublicHeader from '@/components/layout/PublicHeader';

/**
 * Chrome for the public course pages.
 *
 * Scoped to `courses/` rather than the whole `(public)` group on purpose: the
 * auth pages are also in that group and render as a centred card on an empty
 * background, so a group-level layout would put a nav bar on top of the login
 * screen. When the landing page and any other public screens land, either move
 * this up and give the auth pages their own group, or reuse `<PublicHeader />`
 * in each — the header is a component precisely so that stays a free choice.
 *
 * No auth check here. These pages are public by design; what changes for a
 * signed-in viewer is decided per page via `useCourseAccess`.
 */
export default function PublicCoursesLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <PublicHeader />
      <Box component="main" sx={{ p: { xs: 2, sm: 3, lg: 4 } }}>
        {children}
      </Box>
    </Box>
  );
}
