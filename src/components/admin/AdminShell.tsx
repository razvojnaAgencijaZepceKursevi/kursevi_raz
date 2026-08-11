'use client';

import * as React from 'react';
import NextLink from 'next/link';
import MenuIcon from '@mui/icons-material/Menu';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import AdminNavList from './AdminNavList';
import type { StaffRole } from './adminNav';
import AdminUserMenu from './AdminUserMenu';

const SIDEBAR_WIDTH = 264;

/**
 * Chrome for every admin page: fixed sidebar on desktop, a temporary drawer on
 * mobile, and a top bar carrying the user menu.
 *
 * A client component because the drawer holds open/closed state and the nav
 * highlights the current route. The auth check stays in the server layout that
 * renders this — no authorization decision is made here.
 */
export default function AdminShell({
  profile,
  children,
}: {
  profile: { full_name: string; email: string; role: StaffRole };
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const brand = (
    <Stack
      component={NextLink}
      href="/admin"
      direction="row"
      sx={{
        alignItems: 'center',
        gap: 1,
        height: 64,
        px: 3,
        flexShrink: 0,
        textDecoration: 'none',
        color: 'text.primary',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Typography variant="h5" component="span">
        Kursevi
      </Typography>
      <Typography
        variant="overline"
        sx={{
          color: 'primary.main',
          bgcolor: 'action.hover',
          px: 0.75,
          borderRadius: 0.75,
          lineHeight: 1.8,
        }}
      >
        {profile.role === 'teacher' ? 'Predavač' : 'Admin'}
      </Typography>
    </Stack>
  );

  const sidebar = (
    <>
      {brand}
      <Box sx={{ overflowY: 'auto', flex: 1 }}>
        <AdminNavList role={profile.role} onNavigate={() => setMobileOpen(false)} />
      </Box>
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', bgcolor: 'background.default' }}>
      {/* Desktop: always visible, part of the layout flow. */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            borderRight: 1,
            borderColor: 'divider',
          },
        }}
      >
        {sidebar}
      </Drawer>

      {/* Mobile: overlays the content, closes on navigation. */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        // Keeps the DOM mounted between opens, which makes the first open on a
        // phone noticeably faster.
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box' },
        }}
      >
        {sidebar}
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="sticky"
          color="inherit"
          sx={{ bgcolor: 'background.paper', zIndex: (theme) => theme.zIndex.drawer - 1 }}
        >
          <Toolbar sx={{ gap: 1, justifyContent: 'space-between', minHeight: { xs: 64, sm: 64 } }}>
            <IconButton
              onClick={() => setMobileOpen(true)}
              edge="start"
              aria-label="Otvori navigaciju"
              sx={{ display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            {/* Pushes the user menu right on desktop, where there's no button. */}
            <Box sx={{ flex: 1 }} />

            <AdminUserMenu fullName={profile.full_name} email={profile.email} role={profile.role} />
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 3, lg: 4 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
