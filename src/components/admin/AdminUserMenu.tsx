'use client';

import * as React from 'react';
import LogoutIcon from '@mui/icons-material/Logout';
import Avatar from '@mui/material/Avatar';
import ButtonBase from '@mui/material/ButtonBase';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import NextLink from 'next/link';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import SupportOutlinedIcon from '@mui/icons-material/SupportOutlined';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useLogout } from '@/hooks/useLogout';
import { initials } from '@/lib/format';
import { USER_ROLE } from '@/lib/status';
import type { StaffRole } from './adminNav';

/**
 * Avatar + dropdown in the admin top bar. Takes the profile as a prop rather
 * than reading `useAuthStore`, because the layout already has it server-side —
 * passing it down avoids a flash of empty name on first paint.
 */
export default function AdminUserMenu({
  fullName,
  email,
  role,
}: {
  fullName: string;
  email: string;
  role: StaffRole;
}) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { logout, pending } = useLogout();

  return (
    <>
      <ButtonBase
        onClick={(event) => setAnchorEl(event.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchorEl)}
        aria-label="Korisnički meni"
        sx={{ borderRadius: 1.5, p: 0.5, pr: { xs: 0.5, sm: 1.5 }, gap: 1.5 }}
      >
        <Avatar sx={{ width: 32, height: 32, fontSize: '0.8125rem', bgcolor: 'primary.main' }}>
          {initials(fullName)}
        </Avatar>
        <Stack sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'flex-start' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
            {fullName}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>
            {USER_ROLE[role].label}
          </Typography>
        </Stack>
      </ButtonBase>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 220, mt: 1 } } }}
      >
        <Stack sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {fullName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {email}
          </Typography>
        </Stack>

        <Divider />

        {/* `component={NextLink}` is mandatory on MenuItem: it overrides
            ButtonBase's root to 'li', so a bare `href` renders `<li href>` and
            silently does not navigate. Every other MUI link component picks up
            NextLink from the theme on its own — don't add this elsewhere. */}
        <MenuItem component={NextLink} href="/issues" onClick={() => setAnchorEl(null)}>
          <ListItemIcon>
            <SupportOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Moje prijave</Typography>
        </MenuItem>

        <MenuItem
          component={NextLink}
          href="/settings/notifications"
          onClick={() => setAnchorEl(null)}
          sx={{ mt: 0.5 }}
        >
          <ListItemIcon>
            <NotificationsNoneOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Obaveštenja</Typography>
        </MenuItem>

        <MenuItem onClick={() => void logout()} disabled={pending}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">{pending ? 'Odjavljivanje…' : 'Odjavi se'}</Typography>
        </MenuItem>
      </Menu>
    </>
  );
}
