'use client';

import { usePathname } from 'next/navigation';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { NavPending } from '@/components/feedback/NavProgress';
import { isNavItemActive, navForRole, type StaffRole } from './adminNav';

/**
 * The sidebar links. Rendered inside both drawers (mobile and desktop), which
 * is why it's a separate component from the shell — the markup exists once and
 * the two drawers differ only in how they're presented.
 */
export default function AdminNavList({
  role,
  onNavigate,
}: {
  role: StaffRole;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const sections = navForRole(role);

  return (
    <Stack spacing={2.5} sx={{ py: 2 }}>
      {sections.map((section, index) => (
        <Stack key={section.title ?? `section-${index}`} spacing={0.5}>
          {section.title ? (
            <Typography variant="overline" color="text.secondary" sx={{ px: 3 }}>
              {section.title}
            </Typography>
          ) : null}

          <List disablePadding sx={{ px: 1.5 }}>
            {section.items.map((item) => {
              const active = isNavItemActive(item, pathname);
              const Icon = item.icon;

              return (
                <ListItemButton
                  key={item.href}
                  href={item.href}
                  // Closes the mobile drawer on tap; a no-op on desktop.
                  onClick={onNavigate}
                  selected={active}
                  aria-current={active ? 'page' : undefined}
                  sx={{
                    borderRadius: 1.5,
                    mb: 0.25,
                    py: 1,
                    color: active ? 'primary.main' : 'text.secondary',
                    '&.Mui-selected': {
                      bgcolor: 'action.selected',
                      '&:hover': { bgcolor: 'action.selected' },
                    },
                    '&:hover': { color: 'text.primary' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                    <Icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    slotProps={{
                      primary: {
                        variant: 'body2',
                        sx: { fontWeight: active ? 600 : 500 },
                      },
                    }}
                  />
                  {/*
                    Reports this link's pending state to the top-of-shell
                    progress bar. Renders nothing, and has to live *inside* the
                    link — `useLinkStatus` only works on a `<Link>` descendant,
                    and `ListItemButton href` resolves to one through the
                    theme's `LinkComponent`.
                  */}
                  <NavPending />
                </ListItemButton>
              );
            })}
          </List>
        </Stack>
      ))}
    </Stack>
  );
}
